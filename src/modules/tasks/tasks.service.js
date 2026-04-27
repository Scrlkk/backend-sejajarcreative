import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = `
    SELECT t.*, u.full_name AS assignee_name, p.project_name
    FROM core.tasks t
    LEFT JOIN core.users u ON u.id = t.assigned_to
    LEFT JOIN core.projects p ON p.id = t.project_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;
  if (query.project_id) {
    sql += ` AND t.project_id = $${idx++}`;
    params.push(query.project_id);
  }
  if (query.assigned_to) {
    sql += ` AND t.assigned_to = $${idx++}`;
    params.push(query.assigned_to);
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
    `SELECT t.*, u.full_name AS assignee_name, p.project_name
     FROM core.tasks t
     LEFT JOIN core.users u ON u.id = t.assigned_to
     LEFT JOIN core.projects p ON p.id = t.project_id
     WHERE t.id = $1`,
    [id],
  );
  if (!rows[0]) throw new AppError("Task not found", 404);
  return rows[0];
};

export const create = async ({
  project_id,
  title,
  description,
  assigned_to,
  start_date,
  due_date,
}) => {
  if (start_date && due_date && new Date(start_date) > new Date(due_date))
    throw new AppError("start_date tidak boleh melebihi due_date", 422);

  // Validasi jika assigned_to ada, user harus aktif
  if (assigned_to) {
    const { rows: userRows } = await pool.query(
      "SELECT id FROM core.users WHERE id = $1 AND is_active = true",
      [assigned_to],
    );
    if (!userRows[0])
      throw new AppError("Assigned user not found or inactive", 404);
  }

  const { rows } = await pool.query(
    `INSERT INTO core.tasks (project_id, title, description, assigned_to, start_date, due_date)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [project_id, title, description, assigned_to, start_date, due_date],
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

  // Validasi jika assigned_to ada, user harus aktif
  if (fields.assigned_to) {
    const { rows: userRows } = await pool.query(
      "SELECT id FROM core.users WHERE id = $1 AND is_active = true",
      [fields.assigned_to],
    );
    if (!userRows[0])
      throw new AppError("Assigned user not found or inactive", 404);
  }

  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.tasks SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Task not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "DELETE FROM core.tasks WHERE id = $1",
    [id],
  );
  if (!rowCount) throw new AppError("Task not found", 404);
};
