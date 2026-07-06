import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { paginate } from "#utils/pagination.js";
import { updateByIdWithWhitelist } from "#utils/dbHelper.js";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  const showDeleted = query.status === "deleted";
  const showAll = query.status === "all" || query.all === "true" || query.all === true;

  let clientFilter;
  if (showAll) {
    clientFilter = "1=1";
  } else if (showDeleted) {
    clientFilter = "deleted_at IS NOT NULL AND is_active = false";
  } else {
    clientFilter = "is_active = true AND deleted_at IS NULL";
  }

  const { rows } = await pool.query(
    `SELECT * FROM core.clients
     WHERE ${clientFilter}
     ORDER BY id DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    "SELECT * FROM core.clients WHERE id = $1 AND is_active = true AND deleted_at IS NULL",
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
  return updateByIdWithWhitelist(pool, "core.clients", id, fields);
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    `UPDATE core.clients
     SET is_active = false, deleted_at = now(), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Client not found", 404);
};

export const restore = async (id) => {
  const { rows } = await pool.query(
    `UPDATE core.clients
     SET is_active = true, deleted_at = NULL, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id],
  );
  if (!rows[0]) throw new AppError("Client tidak ditemukan", 404);
  return rows[0];
};
