import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

const BASE_SELECT = `
  SELECT n.*, s.full_name AS sender_name
  FROM notification.notifications n
  LEFT JOIN core.users s ON s.id = n.sender_id
`;

// ── Throttle pengecekan kontrak per user (in-memory, 12 jam) ─────────────────
// Mencegah ledakan query database akibat polling unread-count tiap 30 detik.
// Setelah server restart, map ini kosong dan pengecekan pertama langsung berjalan.
const contractCheckThrottle = new Map(); // Key: userId, Value: lastChecked timestamp (ms)
const THROTTLE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 jam

/**
 * Cek dan buat notifikasi kontrak (overdue / tenggat) untuk user tertentu.
 * Dipanggil dari endpoint /api/auth/me (saat boot app) — BUKAN dari polling.
 * Dilindungi throttle 12 jam sehingga aman dipanggil sesering apapun.
 */
export const checkAndCreateContractNotifications = async (userId) => {
  const now = Date.now();
  const lastChecked = contractCheckThrottle.get(userId);
  if (lastChecked && now - lastChecked < THROTTLE_DURATION_MS) {
    return; // Sudah dicek dalam 12 jam terakhir, skip seluruh logika di bawah
  }
  contractCheckThrottle.set(userId, now);

  try {
    const { rows: contracts } = await pool.query(
      `SELECT c.id, c.contract_name, c.contract_code, c.end_date, c.status, c.created_by, c.lead_by
       FROM core.contracts c
       WHERE (c.created_by = $1 OR c.lead_by = $1)
         AND c.deleted_at IS NULL AND c.is_active = true
         AND c.status NOT IN ('completed', 'cancelled')`,
      [userId]
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const c of contracts) {
      if (!c.end_date) continue;
      const endDate = new Date(c.end_date);
      endDate.setHours(0, 0, 0, 0);

      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const formatDate = (dateVal) => {
        const d = new Date(dateVal);
        return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
      };

      if (diffDays < 0) {
        // Contract is overdue
        if (c.status !== "overdue") {
          await pool.query(
            `UPDATE core.contracts SET status = 'overdue', updated_at = now() WHERE id = $1`,
            [c.id]
          );
        }

        const { rows: existing } = await pool.query(
          `SELECT 1 FROM notification.notifications
           WHERE recipient_id = $1 AND source_type = 'contract' AND source_id = $2
             AND title = 'Kontrak Overdue'`,
          [userId, c.id]
        );

        if (existing.length === 0) {
          await createNotification(null, {
            recipient_id: userId,
            sender_id: null,
            title: "Kontrak Overdue",
            message: `Kontrak "${c.contract_name}" (${c.contract_code}) telah melewati tanggal berakhir (${formatDate(c.end_date)}).`,
            source_type: "contract",
            source_id: c.id,
          });
        }
      } else if (diffDays === 0) {
        // Contract deadline today
        const { rows: existing } = await pool.query(
          `SELECT 1 FROM notification.notifications
           WHERE recipient_id = $1 AND source_type = 'contract' AND source_id = $2
             AND title = 'Hari Tenggat Kontrak'`,
          [userId, c.id]
        );

        if (existing.length === 0) {
          await createNotification(null, {
            recipient_id: userId,
            sender_id: null,
            title: "Hari Tenggat Kontrak",
            message: `Hari ini adalah hari terakhir untuk kontrak "${c.contract_name}" (${c.contract_code}).`,
            source_type: "contract",
            source_id: c.id,
          });
        }
      } else if (diffDays <= 3) {
        // Contract ending in 3 days or less
        const { rows: existing } = await pool.query(
          `SELECT 1 FROM notification.notifications
           WHERE recipient_id = $1 AND source_type = 'contract' AND source_id = $2
             AND title = 'Kontrak Akan Berakhir'`,
          [userId, c.id]
        );

        if (existing.length === 0) {
          await createNotification(null, {
            recipient_id: userId,
            sender_id: null,
            title: "Kontrak Akan Berakhir",
            message: `Kontrak "${c.contract_name}" (${c.contract_code}) akan berakhir dalam ${diffDays} hari lagi (${formatDate(c.end_date)}).`,
            source_type: "contract",
            source_id: c.id,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error checking contract notifications:", err);
  }
};

/**
 * Get notifications for the current user.
 * - Only returns notifications where recipient_id = current user
 * - Supports ?is_read filter
 * - Ordered by created_at DESC
 */
export const getMyNotifications = async (userId, query) => {
  // Pengecekan kontrak TIDAK dilakukan di sini — sudah dipindahkan ke /api/auth/me
  // agar tidak dieksekusi setiap kali frontend fetch notifikasi
  const { limit, offset } = paginate(query);
  const params = [userId];
  let sql = `${BASE_SELECT} WHERE n.recipient_id = $1`;
  let idx = 2;

  if (query.is_read !== undefined) {
    sql += ` AND n.is_read = $${idx++}`;
    params.push(query.is_read === "true");
  }

  sql += ` ORDER BY n.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  const { rows } = await pool.query(sql, params);
  return rows;
};

/**
 * Get unread count for current user.
 */
export const getUnreadCount = async (userId) => {
  // Pengecekan kontrak TIDAK dilakukan di sini — polling 30 detik dari frontend
  // tidak boleh memicu puluhan query database. Logika ini ada di /api/auth/me.
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS unread FROM notification.notifications
     WHERE recipient_id = $1 AND is_read = false`,
    [userId],
  );
  return rows[0].unread;
};

/**
 * Get a single notification. Must belong to the requesting user.
 */
export const getById = async (id, userId) => {
  const { rows } = await pool.query(
    `${BASE_SELECT} WHERE n.id = $1 AND n.recipient_id = $2`,
    [id, userId],
  );
  if (!rows.length) throw new AppError("Notifikasi tidak ditemukan", 404);
  return rows[0];
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE notification.notifications
     SET is_read = true, read_at = now()
     WHERE id = $1 AND recipient_id = $2
     RETURNING *`,
    [id, userId],
  );
  if (!rows.length) throw new AppError("Notifikasi tidak ditemukan", 404);
  return rows[0];
};

/**
 * Mark all notifications as read for the current user.
 */
export const markAllAsRead = async (userId) => {
  await pool.query(
    `UPDATE notification.notifications
     SET is_read = true, read_at = now()
     WHERE recipient_id = $1 AND is_read = false`,
    [userId],
  );
  return { updated: true };
};

/**
 * Hard-delete a notification.
 */
export const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `DELETE FROM notification.notifications
     WHERE id = $1 AND recipient_id = $2
     RETURNING id`,
    [id, userId],
  );
  if (!rows.length) throw new AppError("Notifikasi tidak ditemukan", 404);
  return rows[0];
};

/**
 * Create a new notification.
 */
export const createNotification = async (client, data) => {
  const { recipient_id, sender_id, title, message, source_type, source_id } = data;
  const db = client || pool;
  const { rows } = await db.query(
    `INSERT INTO notification.notifications 
       (recipient_id, sender_id, title, message, source_type, source_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [recipient_id, sender_id || null, title, message, source_type, source_id]
  );
  return rows[0];
};
