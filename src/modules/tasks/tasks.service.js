import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = `
    SELECT t.*, c.title AS content_title, c.contract_id, p.pillar_name,
           ct.contract_name
    FROM core.tasks t
    JOIN core.contents c ON c.id = t.content_id
    JOIN core.pillars p ON p.id = t.pillar_id
    JOIN core.contracts ct ON ct.id = c.contract_id
    WHERE t.deleted_at IS NULL
  `;
  const params = [];
  let idx = 1;
  if (query.content_id) {
    sql += ` AND t.content_id = $${idx++}`;
    params.push(query.content_id);
  }
  if (query.contract_id) {
    sql += ` AND c.contract_id = $${idx++}`;
    params.push(query.contract_id);
  }
  if (query.pillar_id) {
    sql += ` AND t.pillar_id = $${idx++}`;
    params.push(query.pillar_id);
  }
  if (query.status) {
    sql += ` AND t.status = $${idx++}`;
    params.push(query.status);
  }
  sql += ` ORDER BY t.due_date ASC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT t.*, c.title AS content_title, c.contract_id, p.pillar_name,
            ct.contract_name
     FROM core.tasks t
     JOIN core.contents c ON c.id = t.content_id
     JOIN core.pillars p ON p.id = t.pillar_id
     JOIN core.contracts ct ON ct.id = c.contract_id
     WHERE t.id = $1 AND t.deleted_at IS NULL`,
    [id],
  );
  if (!rows[0]) throw new AppError("Task not found", 404);
  return rows[0];
};

export const create = async ({
  content_id,
  pillar_id,
  title,
  description,
  start_date,
  due_date,
}) => {
  if (start_date && due_date && new Date(start_date) > new Date(due_date))
    throw new AppError("start_date tidak boleh melebihi due_date", 422);

  const { rows } = await pool.query(
    `INSERT INTO core.tasks (content_id, pillar_id, title, description, start_date, due_date)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [content_id, pillar_id, title, description, start_date, due_date],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  if (
    fields.start_date &&
    fields.due_date &&
    new Date(fields.start_date) > new Date(fields.due_date)
  )
    throw new AppError("start_date tidak boleh melebihi due_date", 422);

  const allowedFields = ["title", "description", "status", "start_date", "due_date", "pillar_id"];
  const keys = Object.keys(fields).filter((k) => allowedFields.includes(k));
  if (!keys.length) throw new AppError("Tidak ada field valid untuk diupdate", 422);

  const values = keys.map((k) => fields[k]);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.tasks SET ${set}, updated_at = now()
     WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Task not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    `UPDATE core.tasks SET deleted_at = now(), is_active = false, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Task not found", 404);
};
