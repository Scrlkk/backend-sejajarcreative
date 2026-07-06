import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { paginate } from "#utils/pagination.js";
import { updateByIdWithWhitelist } from "#utils/dbHelper.js";
import { pickPrimaryRole } from "#utils/userRoles.js";
import { createNotification } from "../notifications/notifications.service.js";

const selectTasksBase = `
  SELECT t.*, c.title AS content_title, c.contract_id, c.format AS content_format,
         c.status AS content_status, c.due_date AS content_due_date, c.scheduled_at AS content_scheduled_at,
         u.full_name AS assignee_name, ct.contract_name,
         pl.platform_name, pl.color_key AS platform_color_key, cc.type_name AS category_name,
         u2.full_name AS lead_name, ct.lead_by AS lead_id, ct.created_by AS contract_created_by,
         (
           SELECT p.pillar_name FROM core.content_pillars cp
           JOIN core.pillars p ON p.id = cp.pillar_id
           WHERE cp.content_id = c.id
           ORDER BY p.pillar_name LIMIT 1
         ) AS pillar_name,
         COALESCE(
           (SELECT json_agg(json_build_object(
              'id', p.id,
              'pillar_name', p.pillar_name,
              'color_key', p.color_key
            ) ORDER BY p.pillar_name)
            FROM core.content_pillars cp
            JOIN core.pillars p ON p.id = cp.pillar_id AND p.is_active = true
            WHERE cp.content_id = c.id),
           '[]'::json
         ) AS pillars,
         COALESCE(
           (SELECT json_agg(r.role_name ORDER BY r.role_name)
            FROM core.user_roles ur
            JOIN core.roles r ON r.id = ur.role_id
            WHERE ur.user_id = t.assigned_to),
           '[]'::json
         ) AS assignee_roles
  FROM core.tasks t
  JOIN core.contents c ON c.id = t.content_id
  JOIN core.users u ON u.id = t.assigned_to
  JOIN core.contracts ct ON ct.id = c.contract_id
  LEFT JOIN core.users u2 ON u2.id = ct.lead_by
  LEFT JOIN core.platforms pl ON pl.id = c.platform_id
  LEFT JOIN core.content_category cc ON cc.id = c.content_category_id
`;

const mapTask = (row) => {
  if (!row) return row;
  const roles = Array.isArray(row.assignee_roles)
    ? row.assignee_roles
    : typeof row.assignee_roles === "string"
      ? JSON.parse(row.assignee_roles)
      : [];
  const pillars = Array.isArray(row.pillars)
    ? row.pillars
    : typeof row.pillars === "string"
      ? JSON.parse(row.pillars)
      : [];
  return {
    ...row,
    assignee_roles: roles,
    assignee_role: pickPrimaryRole(roles),
    pillars,
  };
};

export const syncContentStatus = async (contentId) => {
  try {
    const { rows: contentRows } = await pool.query(
      `SELECT status FROM core.contents WHERE id = $1 AND deleted_at IS NULL`,
      [contentId],
    );
    if (contentRows[0] && contentRows[0].status !== "published") {
      const { rows: siblingTasks } = await pool.query(
        `SELECT id, status FROM core.tasks WHERE content_id = $1 AND deleted_at IS NULL`,
        [contentId],
      );
      const totalTasks = siblingTasks.length;
      const approvedCount = siblingTasks.filter(
        (t) => t.status === "approved",
      ).length;
      const reviewCount = siblingTasks.filter(
        (t) => t.status === "review",
      ).length;
      const revisionCount = siblingTasks.filter(
        (t) => t.status === "revision",
      ).length;

      let newContentStatus = null;
      if (totalTasks > 0) {
        const toDoCount = siblingTasks.filter(
          (t) => t.status === "to_do",
        ).length;
        const onProgressCount = siblingTasks.filter(
          (t) => t.status === "on_progress",
        ).length;

        if (approvedCount === totalTasks) {
          newContentStatus = "approved";
        } else if (reviewCount > 0) {
          newContentStatus = "review";
        } else if (
          revisionCount > 0 ||
          approvedCount > 0 ||
          onProgressCount > 0
        ) {
          newContentStatus = "on_progress";
        } else if (toDoCount === totalTasks) {
          newContentStatus = "assigned";
        }
      }

      if (newContentStatus && newContentStatus !== contentRows[0].status) {
        await pool.query(
          `UPDATE core.contents SET status = $1, updated_at = now() WHERE id = $2 AND deleted_at IS NULL`,
          [newContentStatus, contentId],
        );
      }
    }
  } catch (err) {
    console.error("Failed to sync content plan status:", err.message);
  }
};

export const getAll = async (query, user) => {
  const { limit, offset } = paginate(query);
  const showDeleted = query.status === "deleted";
  const taskFilter = showDeleted
    ? "t.deleted_at IS NOT NULL AND t.is_active = false"
    : "t.deleted_at IS NULL AND t.is_active = true";

  let sql = selectTasksBase + ` WHERE ${taskFilter}`;
  const params = [];
  let idx = 1;

  if (!query.content_id && !query.contract_id && !showDeleted) {
    sql += ` AND c.deleted_at IS NULL AND c.is_active = true
             AND ct.deleted_at IS NULL AND ct.is_active = true`;
  }

  if (query.content_id) {
    sql += ` AND t.content_id = $${idx++}`;
    params.push(query.content_id);
  }
  if (query.contract_id) {
    sql += ` AND c.contract_id = $${idx++}`;
    params.push(query.contract_id);
  }
  if (query.assigned_to) {
    sql += ` AND t.assigned_to = $${idx++}`;
    params.push(query.assigned_to);
  }
  if (query.status && !showDeleted) {
    sql += ` AND t.status = $${idx++}`;
    params.push(query.status);
  }

  // Scoping check for non-superadmins
  if (user && !user.roles.includes("superadmin")) {
    sql += ` AND (t.assigned_to = $${idx} OR ct.lead_by = $${idx} OR ct.created_by = $${idx})`;
    params.push(user.id);
    idx++;
  }

  sql += ` ORDER BY t.deadline ASC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows.map(mapTask);
};

export const getById = async (id, user) => {
  const { rows } = await pool.query(
    `${selectTasksBase} WHERE t.id = $1 AND t.deleted_at IS NULL AND t.is_active = true`,
    [id],
  );
  const task = rows[0];
  if (!task) throw new AppError("Task not found", 404);

  // Scoping check for non-superadmins
  if (user && !user.roles.includes("superadmin")) {
    if (
      Number(task.assigned_to) !== Number(user.id) &&
      Number(task.lead_id) !== Number(user.id) &&
      Number(task.contract_created_by) !== Number(user.id)
    ) {
      throw new AppError("Forbidden: You do not have access to this task", 403);
    }
  }

  return mapTask(task);
};

export const create = async (
  { content_id, assigned_to, title, description, deadline, status },
  createdBy,
) => {
  const contentRes = await pool.query(
    `SELECT c.id, co.created_by AS contract_created_by, co.lead_by AS contract_lead_by
     FROM core.contents c
     JOIN core.contracts co ON co.id = c.contract_id
     WHERE c.id = $1`,
    [content_id],
  );
  const content = contentRes.rows[0];
  if (!content) throw new AppError("Content not found", 404);

  if (createdBy && !createdBy.roles.includes("superadmin")) {
    const isOwner = createdBy.roles.includes("owner") && Number(content.contract_created_by) === Number(createdBy.id);
    const isContractLead = createdBy.roles.includes("content_lead") && Number(content.contract_lead_by) === Number(createdBy.id);
    if (!isOwner && !isContractLead) {
      throw new AppError("Forbidden: You cannot create tasks for this content", 403);
    }
  }

  const targetStatus = status || "to_do";
  const { rows } = await pool.query(
    `INSERT INTO core.tasks (content_id, assigned_to, title, description, deadline, status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [content_id, assigned_to, title, description, deadline, targetStatus],
  );

  const newTask = rows[0];

  try {
    const userRes = await pool.query(
      `SELECT full_name FROM core.users WHERE id = $1`,
      [assigned_to],
    );
    const assigneeName = userRes.rows[0]?.full_name || "Unknown User";

    await pool.query(
      `INSERT INTO core.task_comments (task_id, user_id, message)
       VALUES ($1, NULL, $2)`,
      [newTask.id, `Task assigned to ${assigneeName}`],
    );

    if (title !== "Persiapan Konten") {
      await createNotification(null, {
        recipient_id: assigned_to,
        sender_id: createdBy.id,
        title: "Tugas Baru Ditugaskan",
        message: `Anda mendapat tugas baru: "${title}".`,
        source_type: "task",
        source_id: newTask.id,
      });
    }
  } catch (err) {
    console.error(
      "Failed to create task assignment comments or notification:",
      err.message,
    );
  }

  await syncContentStatus(content_id);

  return newTask;
};

export const update = async (id, fields, updatedBy) => {
  const existingTask = await getById(id, updatedBy);
  const oldAssignee = existingTask.assigned_to;
  const oldStatus = existingTask.status;
  const oldTitle = existingTask.title;

  if (updatedBy && !updatedBy.roles.includes("superadmin")) {
    const isOwner = updatedBy.roles.includes("owner") && Number(existingTask.contract_created_by) === Number(updatedBy.id);
    const isLead = updatedBy.roles.includes("content_lead") && Number(existingTask.lead_id) === Number(updatedBy.id);
    const isAssignee = Number(existingTask.assigned_to) === Number(updatedBy.id);

    // If status is being updated, validate status value permission
    if (fields.status && fields.status !== existingTask.status) {
      if (!isAssignee) {
        // Not assignee: must be owner or lead, and can only set status to revision or approved
        if (!isOwner && !isLead) {
          throw new AppError("Forbidden: You cannot modify this task status", 403);
        }
        const allowedReviewerStatuses = ["revision", "approved"];
        if (!allowedReviewerStatuses.includes(fields.status)) {
          throw new AppError("Forbidden: As owner/lead, you can only set task status to revision or approved", 403);
        }
      } else {
        if (!isOwner && !isLead) {
          const forbiddenAssigneeStatuses = ["revision", "approved"];
          if (forbiddenAssigneeStatuses.includes(fields.status)) {
            throw new AppError("Forbidden: As assignee, you cannot approve or request revision on your own task", 403);
          }
          if (fields.status === "review") {
            const outputRes = await pool.query(
              "SELECT COUNT(*)::int AS cnt FROM core.task_outputs WHERE task_id = $1 AND deleted_at IS NULL",
              [id],
            );
            if (outputRes.rows[0].cnt === 0) {
              throw new AppError("Forbidden: Cannot set task to review status without deliverables or caption", 403);
            }
          }
        }
      }
    }

    // Check non-status fields (metadata)
    const requestedFields = Object.keys(fields);
    const nonStatusFields = requestedFields.filter(f => f !== "status");
    if (nonStatusFields.length > 0) {
      // Only owner can update metadata details
      if (!isOwner && !isLead) {
        throw new AppError("Forbidden: You do not have permission to update task details", 403);
      }
    }
  }

  const updatedTask = await updateByIdWithWhitelist(pool, "core.tasks", id, fields);

  // 1. Notify if assignee changed
  if (
    fields.assigned_to &&
    Number(fields.assigned_to) !== Number(oldAssignee)
  ) {
    try {
      const userRes = await pool.query(
        `SELECT full_name FROM core.users WHERE id = $1`,
        [fields.assigned_to],
      );
      const assigneeName = userRes.rows[0]?.full_name || "Unknown User";

      await pool.query(
        `INSERT INTO core.task_comments (task_id, user_id, message)
         VALUES ($1, NULL, $2)`,
        [id, `Task assigned to ${assigneeName}`],
      );

      await createNotification(null, {
        recipient_id: fields.assigned_to,
        sender_id: updatedBy.id,
        title: "Penugasan Tugas Baru",
        message: `Tugas "${fields.title || existingTask.title}" telah dialihkan/ditugaskan kepada Anda.`,
        source_type: "task",
        source_id: id,
      });
    } catch (err) {
      console.error(
        "Failed to send task reassignment notification or comment:",
        err.message,
      );
    }
  }

  // 2. Notify if status changed
  if (fields.status && fields.status !== oldStatus) {
    const contentId = updatedTask.content_id;
    await syncContentStatus(contentId);
 
    if (fields.status === "review") {
      try {
        const leadRes = await pool.query(
          `SELECT c.lead_by, c.contract_name 
           FROM core.tasks t
           JOIN core.contents ct ON ct.id = t.content_id
           JOIN core.contracts c ON c.id = ct.contract_id
           WHERE t.id = $1`,
          [id],
        );
        if (leadRes.rows[0]) {
          await createNotification(null, {
            recipient_id: leadRes.rows[0].lead_by,
            sender_id: updatedBy.id,
            title: "Pengajuan Review Tugas",
            message: `Tugas "${existingTask.title}" telah diajukan untuk di-review pada kontrak "${leadRes.rows[0].contract_name}".`,
            source_type: "task",
            source_id: id,
          });
        }
      } catch (err) {
        console.error("Failed to send task review notification:", err.message);
      }
    } else if (fields.status === "revision") {
      try {
        await createNotification(null, {
          recipient_id: updatedTask.assigned_to,
          sender_id: updatedBy.id,
          title: "Revisi Tugas",
          message: `Tugas "${existingTask.title}" memerlukan revisi/perbaikan.`,
          source_type: "task",
          source_id: id,
        });
      } catch (err) {
        console.error(
          "Failed to send task revision notification:",
          err.message,
        );
      }
    } else if (fields.status === "approved") {
      try {
        await createNotification(null, {
          recipient_id: updatedTask.assigned_to,
          sender_id: updatedBy.id,
          title: "Tugas Disetujui",
          message: `Tugas "${existingTask.title}" telah disetujui. Terima kasih!`,
          source_type: "task",
          source_id: id,
        });
      } catch (err) {
        console.error(
          "Failed to send task approval notification:",
          err.message,
        );
      }
    }
  }
 
  // 3. Notify if title or description changed
  const newTitle = fields.title !== undefined ? fields.title : oldTitle;
  const titleChanged = fields.title !== undefined && fields.title !== oldTitle;
  const descChanged =
    fields.description !== undefined &&
    fields.description !== existingTask.description;
 
  if (titleChanged || descChanged) {
    try {
      if (oldTitle === "Persiapan Konten" && newTitle !== "Persiapan Konten") {
        await createNotification(null, {
          recipient_id: updatedTask.assigned_to,
          sender_id: updatedBy.id,
          title: "Tugas Baru Ditugaskan",
          message: `Anda mendapat tugas baru: "${newTitle}".`,
          source_type: "task",
          source_id: id,
        });
      } else if (oldTitle !== "Persiapan Konten") {
        await createNotification(null, {
          recipient_id: updatedTask.assigned_to,
          sender_id: updatedBy.id,
          title: "Detail Tugas Diperbarui",
          message: `Tugas Anda "${newTitle}" telah diperbarui.`,
          source_type: "task",
          source_id: id,
        });
      }
    } catch (err) {
      console.error("Failed to send task update notification:", err.message);
    }
  }
 
  return updatedTask;
};

export const remove = async (id, user) => {
  const task = await getById(id, user);

  if (user && !user.roles.includes("superadmin")) {
    const isOwner = user.roles.includes("owner") && Number(task.contract_created_by) === Number(user.id);
    const isContractLead = user.roles.includes("content_lead") && Number(task.lead_id) === Number(user.id);
    if (!isOwner && !isContractLead) {
      throw new AppError("Forbidden: You cannot delete this task", 403);
    }
  }

  const { rowCount } = await pool.query(
    `UPDATE core.tasks SET deleted_at = now(), is_active = false, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Task not found", 404);

  if (task && task.title !== "Persiapan Konten") {
    try {
      await createNotification(null, {
        recipient_id: task.assigned_to,
        sender_id: user.id || null,
        title: "Tugas Dibatalkan/Dihapus",
        message: `Tugas Anda "${task.title}" telah dihapus/dibatalkan dari konten.`,
        source_type: "task",
        source_id: id,
      });
    } catch (err) {
      console.error("Failed to send task removal notification:", err.message);
    }
  }

  await syncContentStatus(task.content_id);
};

export const restore = async (id, user) => {
  const { rows: checkRows } = await pool.query(
    `SELECT t.id, t.assigned_to, ct.created_by AS contract_created_by, ct.lead_by AS lead_id
     FROM core.tasks t
     JOIN core.contents c ON c.id = t.content_id
     JOIN core.contracts ct ON ct.id = c.contract_id
     WHERE t.id = $1`,
    [id],
  );
  if (!checkRows[0]) throw new AppError("Task tidak ditemukan", 404);

  if (user && !user.roles.includes("superadmin")) {
    const isOwner = user.roles.includes("owner") && Number(checkRows[0].contract_created_by) === Number(user.id);
    const isContractLead = user.roles.includes("content_lead") && Number(checkRows[0].lead_id) === Number(user.id);
    if (!isOwner && !isContractLead) {
      throw new AppError("Forbidden: You cannot restore this task", 403);
    }
  }

  const { rows } = await pool.query(
    `UPDATE core.tasks SET is_active = true, deleted_at = NULL, updated_at = now()
     WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!rows[0]) throw new AppError("Task tidak ditemukan", 404);
  const task = await getById(id, user);

  if (task && task.title !== "Persiapan Konten") {
    try {
      await createNotification(null, {
        recipient_id: task.assigned_to,
        sender_id: user.id || null,
        title: "Tugas Diaktifkan Kembali",
        message: `Tugas Anda "${task.title}" telah diaktifkan kembali.`,
        source_type: "task",
        source_id: id,
      });
    } catch (err) {
      console.error(
        "Failed to send task restoration notification:",
        err.message,
      );
    }
  }

  await syncContentStatus(task.content_id);

  return task;
};
