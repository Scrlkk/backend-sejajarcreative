import pool from "#config/database.js";
import { paginate } from "#utils/pagination.js";
import { createNotification } from "../notifications/notifications.service.js";

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
     VALUES ($1,$2,$3) RETURNING id`,
    [content_id, reviewerId, feedback],
  );
  const reviewId = rows[0].id;

  // Ambil data lengkap termasuk reviewer_name agar FE tidak perlu refetch
  const { rows: fullReview } = await pool.query(
    `SELECT cr.*, u.full_name AS reviewer_name
     FROM core.content_reviews cr
     JOIN core.users u ON u.id = cr.reviewer_id
     WHERE cr.id = $1`,
    [reviewId],
  );
  const review = fullReview[0];

  try {
    const contentRes = await pool.query(
      `SELECT title FROM core.contents WHERE id = $1`,
      [content_id],
    );
    const contentTitle = contentRes.rows[0]?.title || "";

    const contentLeadsRes = await pool.query(
      `SELECT ur.user_id
       FROM core.user_roles ur
       JOIN core.roles r ON r.id = ur.role_id
       WHERE r.role_name = 'content_lead'`,
    );

    for (const row of contentLeadsRes.rows) {
      await createNotification(null, {
        recipient_id: row.user_id,
        sender_id: reviewerId,
        title: "Feedback Review Konten",
        message: `Feedback review baru telah ditambahkan untuk rencana konten "${contentTitle}".`,
        source_type: "content_review",
        source_id: review.id,
      });
    }
  } catch (err) {
    console.error("Failed to send content review notifications:", err.message);
  }

  return review;
};
