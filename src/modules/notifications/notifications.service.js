import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

const BASE_SELECT = `
  SELECT n.*, s.full_name AS sender_name
  FROM notification.notifications n
  LEFT JOIN core.users s ON s.id = n.sender_id
`;

/**
 * Get notifications for the current user.
 * - Only returns notifications where recipient_id = current user
 * - Supports ?is_read filter
 * - Ordered by created_at DESC
 */
export const getMyNotifications = async (userId, query) => {
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
