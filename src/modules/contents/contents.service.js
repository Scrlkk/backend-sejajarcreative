import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = `
    SELECT c.*, cp.pillar_name, t.title AS task_title, p.project_name
    FROM core.contents c
    LEFT JOIN core.content_pillars cp ON cp.id = c.content_pillar_id
    LEFT JOIN core.tasks t ON t.id = c.task_id
    LEFT JOIN core.projects p ON p.id = c.project_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;
  if (query.project_id) {
    sql += ` AND c.project_id = $${idx++}`;
    params.push(query.project_id);
  }
  if (query.status) {
    sql += ` AND c.status = $${idx++}`;
    params.push(query.status);
  }
  if (query.pillar_id) {
    sql += ` AND c.content_pillar_id = $${idx++}`;
    params.push(query.pillar_id);
  }
  sql += ` ORDER BY c.publish_date ASC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT c.*, cp.pillar_name, t.title AS task_title, p.project_name
     FROM core.contents c
     LEFT JOIN core.content_pillars cp ON cp.id = c.content_pillar_id
     LEFT JOIN core.tasks t ON t.id = c.task_id
     LEFT JOIN core.projects p ON p.id = c.project_id
     WHERE c.id = $1`,
    [id],
  );
  if (!rows[0]) throw new AppError("Content not found", 404);
  return rows[0];
};

export const create = async ({
  project_id,
  task_id,
  content_pillar_id,
  title,
  file_url,
  caption,
  publish_date,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO core.contents
       (project_id, task_id, content_pillar_id, title, file_url, caption, publish_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      project_id,
      task_id,
      content_pillar_id,
      title,
      file_url,
      caption,
      publish_date,
    ],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.contents SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Content not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "DELETE FROM core.contents WHERE id = $1",
    [id],
  );
  if (!rowCount) throw new AppError("Content not found", 404);
};
