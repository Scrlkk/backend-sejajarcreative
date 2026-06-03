import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const record = async ({ content_id, likes, views }) => {
  const { rows } = await pool.query(
    `INSERT INTO analytics.engagements (content_id, likes, views)
     VALUES ($1,$2,$3) RETURNING *`,
    [content_id, likes ?? 0, views ?? 0],
  );
  return rows[0];
};

export const getByContent = async (contentId, query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT * FROM analytics.engagements
     WHERE content_id = $1
     ORDER BY recorded_at DESC
     LIMIT $2 OFFSET $3`,
    [contentId, limit, offset],
  );
  return rows;
};

export const getSummary = async (contentId) => {
  const { rows } = await pool.query(
    `SELECT
       content_id,
       SUM(likes) AS total_likes,
       SUM(views) AS total_views,
       COUNT(*) AS total_records,
       MIN(recorded_at) AS first_recorded,
       MAX(recorded_at) AS last_recorded
     FROM analytics.engagements
     WHERE content_id = $1
     GROUP BY content_id`,
    [contentId],
  );
  if (!rows[0])
    throw new AppError("Belum ada data engagement untuk konten ini", 404);
  return rows[0];
};

export const getTopContents = async (query) => {
  const limit = Math.min(parseInt(query.limit, 10) || 10, 50);
  let sql = `
    SELECT
      c.id,
      c.title,
      c.contract_id,
      co.contract_name,
      c.status,
      COALESCE(SUM(e.views), 0) AS total_views,
      COALESCE(SUM(e.likes), 0) AS total_likes
    FROM core.contents c
    LEFT JOIN analytics.engagements e ON e.content_id = c.id
    LEFT JOIN core.contracts co ON co.id = c.contract_id
    WHERE c.deleted_at IS NULL
  `;
  const params = [];
  let idx = 1;
  if (query.contract_id) {
    sql += ` AND c.contract_id = $${idx++}`;
    params.push(query.contract_id);
  }
  sql += ` GROUP BY c.id, c.title, c.contract_id, co.contract_name, c.status
           ORDER BY total_views DESC, total_likes DESC
           LIMIT $${idx}`;
  params.push(limit);
  const { rows } = await pool.query(sql, params);
  return rows;
};
