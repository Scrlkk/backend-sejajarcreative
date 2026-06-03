import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getByTaskAssignment = async (assignmentId, query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name AS reviewer_name
     FROM core.reviews r
     JOIN core.users u ON u.id = r.reviewer_id
     WHERE r.task_assignment_id = $1 AND r.deleted_at IS NULL
     ORDER BY r.reviewed_at DESC NULLS LAST, r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [assignmentId, limit, offset],
  );
  return rows;
};

export const create = async (assignmentId, reviewerId, { feedback, status }) => {
  const { rows: assignmentRows } = await pool.query(
    `SELECT ta.id, ta.task_id, ta.status AS assignment_status
     FROM core.task_assignments ta
     WHERE ta.id = $1 AND ta.deleted_at IS NULL`,
    [assignmentId],
  );
  if (!assignmentRows[0]) throw new AppError("Task assignment not found", 404);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO core.reviews (task_assignment_id, reviewer_id, feedback, status, reviewed_at)
       VALUES ($1,$2,$3,$4,now()) RETURNING *`,
      [assignmentId, reviewerId, feedback, status],
    );

    const newAssignmentStatus = status === "approved" ? "done" : "in_progress";
    await client.query(
      `UPDATE core.task_assignments SET status = $1 WHERE id = $2`,
      [newAssignmentStatus, assignmentId],
    );

    if (status === "approved") {
      await client.query(
        `UPDATE core.tasks SET status = 'done', updated_at = now() WHERE id = $1`,
        [assignmentRows[0].task_id],
      );
    }

    await client.query("COMMIT");
    return rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
