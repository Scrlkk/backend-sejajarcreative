import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getByContent = async (contentId, query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name AS reviewer_name, u.role AS reviewer_role
     FROM core.reviews r
     JOIN core.users u ON u.id = r.reviewer_id
     WHERE r.content_id = $1
     ORDER BY r.reviewed_at DESC
     LIMIT $2 OFFSET $3`,
    [contentId, limit, offset],
  );
  return rows;
};

export const create = async (contentId, reviewerId, { feedback, status }) => {
  // Pastikan konten ada sebelum submit review
  const { rows: contentRows } = await pool.query(
    "SELECT id, status FROM core.contents WHERE id = $1",
    [contentId],
  );
  if (!contentRows[0]) throw new AppError("Content not found", 404);

  // Simpan review
  const { rows } = await pool.query(
    `INSERT INTO core.reviews (content_id, reviewer_id, feedback, status, reviewed_at)
     VALUES ($1,$2,$3,$4,now()) RETURNING *`,
    [contentId, reviewerId, feedback, status],
  );

  // Update status konten otomatis berdasarkan hasil review
  const newContentStatus = status === "approved" ? "approved" : "draft";
  await pool.query("UPDATE core.contents SET status = $1 WHERE id = $2", [
    newContentStatus,
    contentId,
  ]);

  return rows[0];
};
