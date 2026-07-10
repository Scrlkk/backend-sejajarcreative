import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { paginate } from "#utils/pagination.js";
import { createNotification } from "../notifications/notifications.service.js";

export const getByTask = async (taskId, query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT * FROM core.task_outputs
     WHERE task_id = $1 AND deleted_at IS NULL
     ORDER BY submitted_at DESC
     LIMIT $2 OFFSET $3`,
    [taskId, limit, offset],
  );
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    "SELECT * FROM core.task_outputs WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  if (!rows[0]) throw new AppError("Task output not found", 404);
  return rows[0];
};

export const create = async (data, user) => {
  const { task_id, caption, hashtag, file_url } = data;

  const { rows: taskRows } = await pool.query(
    "SELECT * FROM core.tasks WHERE id = $1 AND deleted_at IS NULL",
    [task_id],
  );
  if (!taskRows[0]) {
    throw new AppError("Task not found", 404);
  }
  const task = taskRows[0];

  const userRoles = user.roles?.length ? user.roles : user.role ? [user.role] : [];
  const isSuperadmin = userRoles.includes("superadmin");
  const isAssignee = Number(task.assigned_to) === Number(user.id);

  const isContentLeadOrOwner = userRoles.some((r) =>
    ["content_lead", "owner"].includes(r)
  );

  if (!isAssignee && !isSuperadmin && !isContentLeadOrOwner) {
    throw new AppError("Forbidden: Only the task assignee can submit task outputs", 403);
  }

  if (task.status === "approved" && !isSuperadmin && !userRoles.includes("admin_social_media") && !isContentLeadOrOwner) {
    throw new AppError("Forbidden: Cannot submit outputs for an approved task", 403);
  }

  const { rows: versionRows } = await pool.query(
    "SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM core.task_outputs WHERE task_id = $1",
    [task_id],
  );

  const nextVersion = versionRows[0].next_version;

  const { rows } = await pool.query(
    `INSERT INTO core.task_outputs (task_id, caption, hashtag, file_url, version)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [task_id, caption, hashtag, file_url, nextVersion],
  );

  const output = rows[0];

  return output;
};

export const remove = async (id, user) => {
  const { rows } = await pool.query(
    `SELECT t_out.*, t.assigned_to, t.status AS task_status
     FROM core.task_outputs t_out
     JOIN core.tasks t ON t.id = t_out.task_id
     WHERE t_out.id = $1 AND t_out.deleted_at IS NULL`,
    [id],
  );

  if (!rows[0]) {
    throw new AppError("Task output not found", 404);
  }

  const taskOutput = rows[0];

  const userRoles = user.roles?.length
    ? user.roles
    : user.role
      ? [user.role]
      : [];
  const isSuperadmin = userRoles.includes("superadmin");
  const isAssignee = Number(taskOutput.assigned_to) === Number(user.id);

  if (!isAssignee && !isSuperadmin) {
    throw new AppError("Forbidden: You are not authorized to delete this task output", 403);
  }

  if (["approved", "scheduled", "published"].includes(taskOutput.task_status?.toLowerCase())) {
    throw new AppError("Forbidden: Cannot delete task output of an approved, scheduled, or published task", 403);
  }

  const { rowCount } = await pool.query(
    "UPDATE core.task_outputs SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  if (!rowCount) throw new AppError("Task output not found", 404);

  // If no remaining outputs for this task, reset status from review → on_progress
  const { rows: remaining } = await pool.query(
    "SELECT COUNT(*)::int AS cnt FROM core.task_outputs WHERE task_id = $1 AND deleted_at IS NULL",
    [taskOutput.task_id],
  );

  if (remaining[0].cnt === 0) {
    await pool.query(
      `UPDATE core.tasks SET status = 'on_progress', updated_at = now()
       WHERE id = $1 AND status = 'review'`,
      [taskOutput.task_id],
    );
  }
};

export const update = async (id, data, user) => {
  const { rows } = await pool.query(
    `SELECT t_out.*, t.assigned_to
     FROM core.task_outputs t_out
     JOIN core.tasks t ON t.id = t_out.task_id
     WHERE t_out.id = $1 AND t_out.deleted_at IS NULL`,
    [id],
  );

  if (!rows[0]) throw new AppError("Task output not found", 404);

  const taskOutput = rows[0];
  const userRoles = user.roles?.length ? user.roles : user.role ? [user.role] : [];
  const isSuperadmin = userRoles.includes("superadmin");
  const isAssignee = Number(taskOutput.assigned_to) === Number(user.id);
  const isLeadOrAdmin = userRoles.some((r) => ["content_lead", "owner", "admin_social_media"].includes(r));

  if (!isAssignee && !isSuperadmin && !isLeadOrAdmin) {
    throw new AppError("Forbidden", 403);
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (data.caption !== undefined) { fields.push(`caption = $${idx++}`); values.push(data.caption); }
  if (data.hashtag !== undefined) { fields.push(`hashtag = $${idx++}`); values.push(data.hashtag); }

  if (fields.length === 0) throw new AppError("No fields to update", 400);

  values.push(id);

  const { rows: updated } = await pool.query(
    `UPDATE core.task_outputs SET ${fields.join(", ")} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
    values,
  );

  return updated[0];
};
