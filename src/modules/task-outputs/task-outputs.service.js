import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getByTask = async (taskId, query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT * FROM core.task_outputs
     WHERE task_id = $1 AND deleted_at IS NULL
     ORDER BY submitted_at DESC
     LIMIT $2 OFFSET $3`,
    [taskId, limit, offset],
  );
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    "SELECT * FROM core.task_outputs WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  if (!rows[0]) throw new AppError("Task output not found", 404);
  return rows[0];
};

export const create = async (data) => {
  const { task_id, caption, hashtag, file_url } = data;

  const { rows: versionRows } = await pool.query(
    "SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM core.task_outputs WHERE task_id = $1",
    [task_id],
  );

  const { rows } = await pool.query(
    `INSERT INTO core.task_outputs (task_id, caption, hashtag, file_url, version)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [task_id, caption, hashtag, file_url, versionRows[0].next_version],
  );
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "UPDATE core.task_outputs SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  if (!rowCount) throw new AppError("Task output not found", 404);
};
