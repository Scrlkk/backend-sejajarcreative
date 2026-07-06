import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { paginate } from "#utils/pagination.js";
import { updateByIdWithWhitelist } from "#utils/dbHelper.js";

export const getAll = async (query = {}) => {
  const { limit, offset } = paginate(query);
  let sql = "SELECT * FROM core.content_category WHERE is_active = true";
  const params = [];
  if (query.include_inactive === "true") {
    sql = "SELECT * FROM core.content_category WHERE 1=1";
  }
  sql += ` ORDER BY id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM core.content_category WHERE id = $1 AND is_active = true`,
    [id],
  );
  if (!rows[0]) throw new AppError("Content category not found", 404);
  return rows[0];
};

export const create = async (data) => {
  const { type_name, color_key } = data;
  const { rows } = await pool.query(
    `INSERT INTO core.content_category (type_name, color_key) VALUES ($1, $2) RETURNING *`,
    [type_name, color_key || null],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  return updateByIdWithWhitelist(pool, "core.content_category", id, fields);
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    `UPDATE core.content_category SET is_active = false, updated_at = now() WHERE id = $1 AND is_active = true`,
    [id],
  );
  if (!rowCount) throw new AppError("Content category not found", 404);
};
