import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    "SELECT * FROM core.clients ORDER BY id DESC LIMIT $1 OFFSET $2",
    [limit, offset],
  );
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    "SELECT * FROM core.clients WHERE id = $1",
    [id],
  );
  if (!rows[0]) throw new AppError("Client not found", 404);
  return rows[0];
};

export const create = async ({
  client_name,
  company_name,
  contact_email,
  contact_phone,
}) => {
  const { rows } = await pool.query(
    "INSERT INTO core.clients (client_name, company_name, contact_email, contact_phone) VALUES ($1,$2,$3,$4) RETURNING *",
    [client_name, company_name, contact_email, contact_phone],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.clients SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Client not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "DELETE FROM core.clients WHERE id = $1",
    [id],
  );
  if (!rowCount) throw new AppError("Client not found", 404);
};