import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getByTask = async (taskId, query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT tc.*, u.full_name AS user_name
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
     VALUES ($1,$2,$3) RETURNING *`,
    [task_id, userId, message],
  );
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "UPDATE core.task_comments SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  if (!rowCount) throw new AppError("Task comment not found", 404);
};
