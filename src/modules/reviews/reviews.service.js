import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getByContent = async (contentId, query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT cr.*, u.full_name AS reviewer_name
     FROM core.content_reviews cr
     JOIN core.users u ON u.id = cr.reviewer_id
     WHERE cr.content_id = $1 AND cr.deleted_at IS NULL
     ORDER BY cr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [contentId, limit, offset],
  );
  return rows;
};

export const create = async (reviewerId, { content_id, feedback }) => {
  const { rows } = await pool.query(
    `INSERT INTO core.content_reviews (content_id, reviewer_id, feedback)
     VALUES ($1,$2,$3) RETURNING *`,
    [content_id, reviewerId, feedback],
  );
  return rows[0];
};
