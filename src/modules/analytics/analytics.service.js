import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const record = async ({
  content_id,
  likes,
  views,
  comments,
  shares,
  recorded_at,
}) => {
  const contentRes = await pool.query(
    "SELECT status FROM core.contents WHERE id = $1 AND deleted_at IS NULL",
    [content_id]
  );
  const content = contentRes.rows[0];
  if (!content) throw new AppError("Konten tidak ditemukan", 404);
  if (content.status !== "published") {
    throw new AppError("Tidak dapat menambahkan engagement pada konten yang belum dipublikasikan", 400);
  }

  // Get current totals for this content to validate likes vs views
  const totalsRes = await pool.query(
    `SELECT COALESCE(SUM(views), 0)::int AS total_views, COALESCE(SUM(likes), 0)::int AS total_likes
     FROM analytics.engagements WHERE content_id = $1`,
    [content_id]
  );
  const currentViews = totalsRes.rows[0]?.total_views || 0;
  const currentLikes = totalsRes.rows[0]?.total_likes || 0;

  const newViews = currentViews + (views ?? 0);
  const newLikes = currentLikes + (likes ?? 0);

  if (newLikes > newViews) {
    throw new AppError("Jumlah akumulasi likes tidak boleh melebihi jumlah views", 400);
  }

  const { rows } = await pool.query(
    `INSERT INTO analytics.engagements (content_id, likes, views, comments, shares, recorded_at)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, now())) RETURNING *`,
    [
      content_id,
      likes ?? 0,
      views ?? 0,
      comments ?? 0,
      shares ?? 0,
      recorded_at || null,
    ],
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
       SUM(comments) AS total_comments,
       SUM(shares) AS total_shares,
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
      c.platform_id,
      p.platform_name,
      MAX(e.recorded_at) AS last_updated,
      COALESCE(SUM(e.views), 0) AS total_views,
      COALESCE(SUM(e.likes), 0) AS total_likes,
      COALESCE(SUM(e.comments), 0) AS total_comments,
      COALESCE(SUM(e.shares), 0) AS total_shares
    FROM core.contents c
    LEFT JOIN analytics.engagements e ON e.content_id = c.id
    LEFT JOIN core.contracts co ON co.id = c.contract_id
    LEFT JOIN core.platforms p ON p.id = c.platform_id
    WHERE c.deleted_at IS NULL AND c.is_active = true
      AND c.status = 'published'
      AND co.deleted_at IS NULL AND co.is_active = true
  `;
  const params = [];
  let idx = 1;
  if (query.contract_id) {
    sql += ` AND c.contract_id = $${idx++}`;
    params.push(query.contract_id);
  }
  sql += ` GROUP BY c.id, c.title, c.contract_id, co.contract_name, c.status, c.platform_id, p.platform_name
           ORDER BY total_views DESC, total_likes DESC
           LIMIT $${idx}`;
  params.push(limit);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const deleteByContent = async (contentId) => {
  const { rows } = await pool.query(
    "DELETE FROM analytics.engagements WHERE content_id = $1 RETURNING *",
    [contentId]
  );
  return rows;
};

