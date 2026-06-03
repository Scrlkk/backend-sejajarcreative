import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

const notDeleted = "c.deleted_at IS NULL AND c.is_active = true";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = `SELECT c.*, cl.client_name, u.full_name AS created_by_name
             FROM core.contracts c
             JOIN core.clients cl ON cl.id = c.client_id
             JOIN core.users u ON u.id = c.created_by
             WHERE ${notDeleted}`;
  const params = [];
  let idx = 1;
  if (query.client_id) {
    sql += ` AND c.client_id = $${idx++}`;
    params.push(query.client_id);
  }
  if (query.status) {
    sql += ` AND c.status = $${idx++}`;
    params.push(query.status);
  }
  sql += ` ORDER BY c.id DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT c.*, cl.client_name, u.full_name AS created_by_name
     FROM core.contracts c
     JOIN core.clients cl ON cl.id = c.client_id
     JOIN core.users u ON u.id = c.created_by
     WHERE c.id = $1 AND ${notDeleted}`,
    [id],
  );
  if (!rows[0]) throw new AppError("Contract not found", 404);
  return rows[0];
};

export const create = async (data, createdBy) => {
  const { client_id, contract_name, description, start_date, end_date } = data;
  const { rows } = await pool.query(
    `INSERT INTO core.contracts (client_id, contract_name, description, start_date, end_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [client_id, contract_name, description, start_date, end_date, createdBy],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  const allowedFields = [
    "contract_name",
    "description",
    "status",
    "start_date",
    "end_date",
  ];
  const keys = Object.keys(fields).filter((k) => allowedFields.includes(k));
  if (!keys.length) throw new AppError("Tidak ada field valid untuk diupdate", 422);

  const values = keys.map((k) => fields[k]);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

  const { rows } = await pool.query(
    `UPDATE core.contracts SET ${set}, updated_at = now()
     WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Contract not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    `UPDATE core.contracts SET deleted_at = now(), is_active = false, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Contract not found", 404);
};
