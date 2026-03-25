import pool from "../../config/database.js";
import { hash } from "../../utils/hash.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    "SELECT id, full_name, email, role, created_at FROM core.users ORDER BY id LIMIT $1 OFFSET $2",
    [limit, offset],
  );
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, role, created_at FROM core.users WHERE id = $1",
    [id],
  );
  if (!rows[0]) throw new AppError("User not found", 404);
  return rows[0];
};

export const create = async ({ full_name, email, password, role }) => {
  const hashed = await hash(password);
  const { rows } = await pool.query(
    "INSERT INTO core.users (full_name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, full_name, email, role, created_at",
    [full_name, email, hashed, role],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  if (fields.password) fields.password = await hash(fields.password);
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.users SET ${set} WHERE id = $${keys.length + 1} RETURNING id, full_name, email, role`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("User not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "DELETE FROM core.users WHERE id = $1",
    [id],
  );
  if (!rowCount) throw new AppError("User not found", 404);
};
