import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

const baseSelect = `
  SELECT ta.*, u.full_name AS assignee_name, t.title AS task_title, t.content_id
  FROM core.task_assignments ta
  JOIN core.tasks t ON t.id = ta.task_id
  JOIN core.users u ON u.id = ta.assigned_to
  WHERE ta.deleted_at IS NULL
`;

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = baseSelect;
  const params = [];
  let idx = 1;
  if (query.task_id) {
    sql += ` AND ta.task_id = $${idx++}`;
    params.push(query.task_id);
  }
  if (query.assigned_to) {
    sql += ` AND ta.assigned_to = $${idx++}`;
    params.push(query.assigned_to);
  }
  if (query.status) {
    sql += ` AND ta.status = $${idx++}`;
    params.push(query.status);
  }
  sql += ` ORDER BY ta.id DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `${baseSelect} AND ta.id = $1`,
    [id],
  );
  if (!rows[0]) throw new AppError("Task assignment not found", 404);
  return rows[0];
};

export const create = async (data) => {
  const {
    task_id,
    assigned_to,
    assignment_role,
    script_text,
    file_url,
    notes_from_admin,
  } = data;

  const { rows: userRows } = await pool.query(
    "SELECT id FROM core.users WHERE id = $1 AND is_active = true",
    [assigned_to],
  );
  if (!userRows[0]) throw new AppError("Assigned user not found or inactive", 404);

  const { rows } = await pool.query(
    `INSERT INTO core.task_assignments
       (task_id, assigned_to, assignment_role, script_text, file_url, notes_from_admin)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      task_id,
      assigned_to,
      assignment_role,
      script_text,
      file_url,
      notes_from_admin,
    ],
  );
  return getById(rows[0].id);
};

export const update = async (id, fields) => {
  const allowedFields = [
    "status",
    "assignment_role",
    "assigned_to",
  ];
  const keys = Object.keys(fields).filter((k) => allowedFields.includes(k));
  if (!keys.length) throw new AppError("Tidak ada field valid untuk diupdate", 422);

  if (fields.assigned_to) {
    const { rows: userRows } = await pool.query(
      "SELECT id FROM core.users WHERE id = $1 AND is_active = true",
      [fields.assigned_to],
    );
    if (!userRows[0]) throw new AppError("Assigned user not found or inactive", 404);
  }

  const values = keys.map((k) => fields[k]);
  let set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  if (fields.status === "done" || fields.status === "review") {
    set += ", submitted_at = COALESCE(submitted_at, now())";
  }

  const { rows } = await pool.query(
    `UPDATE core.task_assignments SET ${set}
     WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Task assignment not found", 404);
  return getById(id);
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "UPDATE core.task_assignments SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  if (!rowCount) throw new AppError("Task assignment not found", 404);
};
