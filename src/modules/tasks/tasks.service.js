import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";
import { updateByIdWithWhitelist } from "../../utils/dbHelper.js";
import { pickPrimaryRole } from "../../utils/userRoles.js";
import { createNotification } from "../notifications/notifications.service.js";

const selectTasksBase = `
  SELECT t.*, c.title AS content_title, c.contract_id, c.format AS content_format,
         c.status AS content_status, c.due_date AS content_due_date, c.scheduled_at AS content_scheduled_at,
         u.full_name AS assignee_name, ct.contract_name,
         pl.platform_name, pl.color_key AS platform_color_key, cc.type_name AS category_name,
         u2.full_name AS lead_name, ct.lead_by AS lead_id,
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

export const getAll = async (query) => {
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
  sql += ` ORDER BY t.deadline ASC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows.map(mapTask);
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `${selectTasksBase} WHERE t.id = $1 AND t.deleted_at IS NULL AND t.is_active = true`,
    [id],
  );
  if (!rows[0]) throw new AppError("Task not found", 404);
  return mapTask(rows[0]);
};

export const create = async (
  { content_id, assigned_to, title, description, deadline, status },
  createdBy,
) => {
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
        sender_id: createdBy,
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

  return newTask;
};

export const update = async (id, fields, updatedBy) => {
  const existingTask = await getById(id);
  const oldAssignee = existingTask.assigned_to;
  const oldStatus = existingTask.status;
  const oldTitle = existingTask.title;

  // Filter only allowed fields and run update; throws 422 if no valid fields
  const allowedFields = ["title", "description", "status", "deadline", "assigned_to"];
  const validFields = Object.fromEntries(
    Object.entries(fields).filter(([k]) => allowedFields.includes(k))
  );
  if (!Object.keys(validFields).length)
    throw new AppError("Tidak ada field valid untuk diupdate", 422);

  const keys = Object.keys(validFields);
  const values = keys.map((k) => validFields[k]);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.tasks SET ${set}, updated_at = now()
     WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Task not found", 404);

  const updatedTask = rows[0];

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
        sender_id: updatedBy,
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
    try {
      // Sync content plan status automatically based on tasks progression
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
            // Content is "approved" (ready for admin social media to schedule)
            // "scheduled" is only set when admin social media picks date/time via ModalPreviewPublish
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
      console.error(
        "Failed to sync content plan status based on task updates:",
        err.message,
      );
    }

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
            sender_id: updatedBy,
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
          sender_id: updatedBy,
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
          sender_id: updatedBy,
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
          sender_id: updatedBy,
          title: "Tugas Baru Ditugaskan",
          message: `Anda mendapat tugas baru: "${newTitle}".`,
          source_type: "task",
          source_id: id,
        });
      } else if (oldTitle !== "Persiapan Konten") {
        await createNotification(null, {
          recipient_id: updatedTask.assigned_to,
          sender_id: updatedBy,
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

export const remove = async (id, deletedBy) => {
  const task = await getById(id);

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
        sender_id: deletedBy || null,
        title: "Tugas Dibatalkan/Dihapus",
        message: `Tugas Anda "${task.title}" telah dihapus/dibatalkan dari konten.`,
        source_type: "task",
        source_id: id,
      });
    } catch (err) {
      console.error("Failed to send task removal notification:", err.message);
    }
  }
};

export const restore = async (id, restoredBy) => {
  const { rows } = await pool.query(
    `UPDATE core.tasks SET is_active = true, deleted_at = NULL, updated_at = now()
     WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!rows[0]) throw new AppError("Task tidak ditemukan", 404);
  const task = await getById(id);

  if (task && task.title !== "Persiapan Konten") {
    try {
      await createNotification(null, {
        recipient_id: task.assigned_to,
        sender_id: restoredBy || null,
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

  return task;
};
