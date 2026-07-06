import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { paginate } from "#utils/pagination.js";
import { createNotification } from "../notifications/notifications.service.js";

export const getByTask = async (taskId, query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT tc.*, COALESCE(u.full_name, 'SYSTEM') AS user_name
     FROM core.task_comments tc
     LEFT JOIN core.users u ON u.id = tc.user_id
     WHERE tc.task_id = $1 AND tc.deleted_at IS NULL
     ORDER BY tc.created_at ASC
     LIMIT $2 OFFSET $3`,
    [taskId, limit, offset],
  );
  return rows;
};

export const create = async (data, userId) => {
  const { task_id, message } = data;
  const { rows } = await pool.query(
    `INSERT INTO core.task_comments (task_id, user_id, message)
     VALUES ($1,$2,$3) RETURNING id`,
    [task_id, userId, message],
  );
  const commentId = rows[0].id;

  // Ambil data lengkap termasuk user_name agar FE tidak perlu refetch
  const { rows: fullComment } = await pool.query(
    `SELECT tc.*, COALESCE(u.full_name, 'SYSTEM') AS user_name
     FROM core.task_comments tc
     LEFT JOIN core.users u ON u.id = tc.user_id
     WHERE tc.id = $1`,
    [commentId],
  );
  const comment = fullComment[0];

  try {
    const taskRes = await pool.query(
      `SELECT t.title, t.assigned_to, c.lead_by, c.contract_name
       FROM core.tasks t
       JOIN core.contents ct ON ct.id = t.content_id
       JOIN core.contracts c ON c.id = ct.contract_id
       WHERE t.id = $1`,
      [task_id]
    );

    if (taskRes.rows[0]) {
      const task = taskRes.rows[0];
      const recipientId = (Number(userId) === Number(task.assigned_to))
        ? task.lead_by
        : task.assigned_to;

      await createNotification(null, {
        recipient_id: recipientId,
        sender_id: userId,
        title: "Komentar Baru di Tugas",
        message: `Ada komentar baru pada tugas "${task.title}": "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        source_type: "task_comment",
        source_id: comment.id,
      });
    }
  } catch (err) {
    console.error("Failed to send task comment notification:", err.message);
  }

  return comment;
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "UPDATE core.task_comments SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  if (!rowCount) throw new AppError("Task comment not found", 404);
};
