import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { getStorageUsage, getSessionStats } from "./dashboard.helpers.js";

// ─── Calendar Widget ──────────────────────────────────────────────────────────

/**
 * Parse YYYY-MM string to date range [start of month, start of next month).
 * Jika tidak dikirim, default ke bulan berjalan.
 */
const parseMonthRange = (monthStr) => {
  if (!monthStr) {
    const now = new Date();
    monthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  if (!/^\d{4}-\d{2}$/.test(monthStr)) {
    throw new AppError(
      'Parameter month wajib diisi dengan format YYYY-MM (contoh: 2026-06)',
      422,
    );
  }
  const [year, month] = monthStr.split('-').map(Number);
  if (month < 1 || month > 12) {
    throw new AppError('Bulan harus antara 01-12', 422);
  }
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to   = new Date(Date.UTC(year, month, 1));     // exclusive upper bound
  return { from, to, resolvedMonth: monthStr };
};

/**
 * Calendar — semua role, scope berbeda:
 * - superadmin / owner / content_lead → semua konten & task
 * - script_writer / content_editor / admin_social_media → task milik user + konten terkait
 */
export const getCalendarWidget = async (role, userId, query = {}) => {
  const { from, to, resolvedMonth } = parseMonthRange(query.month);

  const STAFF_ROLES = ['script_writer', 'content_editor', 'admin_social_media'];
  const isStaff = STAFF_ROLES.includes(role);

  let contents, tasks;

  if (isStaff) {
    // Staff: hanya task milik user login + konten yang terhubung
    const [tasksResult] = await Promise.all([
      pool.query(
        `SELECT
           t.id,
           t.title,
           t.status,
           t.deadline,
           c.id AS content_id,
           c.title AS content_title,
           c.due_date,
           p.platform_name
         FROM core.tasks t
         JOIN core.contents c ON c.id = t.content_id
         JOIN core.platforms p ON p.id = c.platform_id
         WHERE t.assigned_to = $1
           AND t.deleted_at IS NULL
           AND t.deadline >= $2
           AND t.deadline < $3
         ORDER BY t.deadline ASC NULLS LAST`,
        [userId, from, to],
      ),
    ]);

    // Ambil konten unik dari task tersebut
    // Tidak difilter by due_date — konten muncul jika ada task-nya di bulan ini
    const contentIds = [...new Set(tasksResult.rows.map((r) => r.content_id))];
    let contentsResult = { rows: [] };
    if (contentIds.length > 0) {
      contentsResult = await pool.query(
        `SELECT
           c.id,
           c.title,
           c.status,
           c.due_date,
           p.platform_name
         FROM core.contents c
         JOIN core.platforms p ON p.id = c.platform_id
         WHERE c.id = ANY($1::int[])
           AND c.deleted_at IS NULL
           AND c.is_active = true
         ORDER BY c.due_date ASC NULLS LAST`,
        [contentIds],
      );
    }

    contents = contentsResult.rows;
    tasks    = tasksResult.rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      deadline: r.deadline,
      platform_name: r.platform_name,
      content_id: r.content_id,
      content_title: r.content_title,
    }));

  } else {
    // Superadmin / Owner / Content Lead → semua konten & task di bulan tersebut
    const [contentsResult, tasksResult] = await Promise.all([
      pool.query(
        `SELECT
           c.id,
           c.title,
           c.status,
           c.due_date,
           p.platform_name
         FROM core.contents c
         JOIN core.platforms p ON p.id = c.platform_id
         WHERE c.due_date >= $1
           AND c.due_date < $2
           AND c.deleted_at IS NULL
           AND c.is_active = true
         ORDER BY c.due_date ASC`,
        [from, to],
      ),
      pool.query(
        `SELECT
           t.id,
           t.title,
           t.status,
           t.deadline,
           c.id AS content_id,
           c.title AS content_title,
           p.platform_name
         FROM core.tasks t
         JOIN core.contents c ON c.id = t.content_id
         JOIN core.platforms p ON p.id = c.platform_id
         WHERE t.deadline >= $1
           AND t.deadline < $2
           AND t.deleted_at IS NULL
           AND c.deleted_at IS NULL
           AND c.is_active = true
         ORDER BY t.deadline ASC`,
        [from, to],
      ),
    ]);

    contents = contentsResult.rows;
    tasks    = tasksResult.rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      deadline: r.deadline,
      platform_name: r.platform_name,
      content_id: r.content_id,
      content_title: r.content_title,
    }));
  }

  return {
    widget: 'calendar',
    month: resolvedMonth,
    scope: isStaff ? 'user' : 'all',
    contents,
    tasks,
  };
};

// ─── System Logs Summary Widget ───────────────────────────────────────────────

export const getSystemLogsSummaryWidget = async () => {
  const [logsResult, storage, sessions] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*)::int AS total_activity,
         COUNT(*) FILTER (WHERE action = 'LOGIN')::int AS login_count,
         COUNT(*) FILTER (WHERE action = 'CREATE')::int AS create_count,
         COUNT(*) FILTER (WHERE action = 'UPDATE')::int AS update_count,
         COUNT(*) FILTER (WHERE action = 'DELETE')::int AS delete_count,
         COUNT(*) FILTER (WHERE action = 'READ')::int AS read_count
       FROM audit.activity_logs`,
    ),
    Promise.resolve(getStorageUsage()),
    getSessionStats(),
  ]);

  const logs = logsResult.rows[0];

  return {
    widget: 'system-logs-summary',
    activity: {
      total: logs.total_activity,
      login: logs.login_count,
      create: logs.create_count,
      update: logs.update_count,
      delete: logs.delete_count,
      read: logs.read_count,
    },
    storage,
    sessions: {
      active: sessions.active,
      online_users: sessions.online_users,
    },
  };
};
