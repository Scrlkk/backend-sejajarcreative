import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getAll = async (query = {}) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT * FROM core.platforms ORDER BY id ASC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT * FROM core.platforms WHERE id = $1`,
    [id],
  );
  if (!rows[0]) throw new AppError("Platform not found", 404);
  return rows[0];
};

export const create = async (data) => {
  const { platform_name } = data;
  const { rows } = await pool.query(
    `INSERT INTO core.platforms (platform_name) VALUES ($1) RETURNING *`,
    [platform_name],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  const allowedFields = ["platform_name"];
  const keys = Object.keys(fields).filter((k) => allowedFields.includes(k));
  if (!keys.length)
    throw new AppError("Tidak ada field valid untuk diupdate", 422);

  const values = keys.map((k) => fields[k]);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

  const { rows } = await pool.query(
    `UPDATE core.platforms SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Platform not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    `DELETE FROM core.platforms WHERE id = $1`,
    [id],
  );
  if (!rowCount) throw new AppError("Platform not found", 404);
};
