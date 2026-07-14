import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { paginate } from "#utils/pagination.js";
import { createNotification } from "../notifications/notifications.service.js";
import { updateByIdWithWhitelist } from "#utils/dbHelper.js";
import { syncContentStatus } from "../tasks/tasks.service.js";
import { checkContractStatusByContentId } from "#utils/contractValidation.js";

const listSelect = `
  SELECT c.*,
         pl.platform_name,
         pl.color_key AS platform_color_key,
         cc.type_name AS category_name,
         cc.color_key AS category_color_key,
         co.contract_name,
         co.contract_code,
         co.status AS contract_status,
         co.created_by AS contract_created_by,
         co.lead_by AS contract_lead_by,
         (SELECT cr.feedback 
          FROM core.content_reviews cr 
          WHERE cr.content_id = c.id AND cr.deleted_at IS NULL 
          ORDER BY cr.created_at DESC LIMIT 1) AS latest_feedback,
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
           (SELECT json_agg(json_build_object(
              'id', u.id,
              'full_name', u.full_name,
              'is_online', EXISTS(
                SELECT 1 FROM auth.refresh_tokens rt 
                WHERE rt.user_id = u.id AND rt.expires_at > NOW()
              ),
              'role', ct.role,
              'roles', json_build_array(ct.role)
            ))
            FROM core.content_teams ct
            JOIN core.users u ON u.id = ct.user_id
            WHERE ct.content_id = c.id),
           '[]'::json
         ) AS teams
  FROM core.contents c
  JOIN core.platforms pl ON pl.id = c.platform_id
  JOIN core.content_category cc ON cc.id = c.content_category_id
  JOIN core.contracts co ON co.id = c.contract_id
`;

const syncTeams = async (client, contentId, teams) => {
  if (!Array.isArray(teams)) return { addedUsers: [], removedUsers: [] };

  const newTeams = teams.map((item) => {
    if (typeof item === "object" && item !== null) {
      return {
        user_id: Number(item.user_id),
        role: item.role || "member",
      };
    } else {
      return {
        user_id: Number(item),
        role: "member",
      };
    }
  });

  const newUserIds = [...new Set(newTeams.map((t) => t.user_id))];

  const { rows: existingRows } = await client.query(
    "SELECT user_id, role FROM core.content_teams WHERE content_id = $1",
    [contentId],
  );
  const existingUserIds = [...new Set(existingRows.map((row) => Number(row.user_id)))];

  const addedUsers = newUserIds.filter((uid) => !existingUserIds.includes(uid));
  const removedUsers = existingUserIds.filter(
    (uid) => !newUserIds.includes(uid),
  );

  const removedAssignments = existingRows.filter(
    (existing) => !newTeams.some(
      (item) => Number(item.user_id) === Number(existing.user_id) && item.role === existing.role
    )
  );

  await client.query("DELETE FROM core.content_teams WHERE content_id = $1", [
    contentId,
  ]);

  if (newTeams.length > 0) {
    const values = newTeams.map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(", ");
    const params = [contentId];
    newTeams.forEach((t) => {
      params.push(t.user_id, t.role);
    });
    await client.query(
      `INSERT INTO core.content_teams (content_id, user_id, role) VALUES ${values}`,
      params,
    );
  }

  // Soft-delete tugas untuk kombinasi user-role yang dihapus
  if (removedAssignments.length > 0) {
    for (const assignment of removedAssignments) {
      await client.query(
        `UPDATE core.tasks 
         SET deleted_at = now(), is_active = false, updated_at = now()
         WHERE content_id = $1 
           AND assigned_to = $2 
           AND role = $3
           AND deleted_at IS NULL`,
        [contentId, assignment.user_id, assignment.role],
      );
    }
  }

  return { addedUsers, removedUsers };
};

const syncPillars = async (client, contentId, pillarIds) => {
  if (!Array.isArray(pillarIds) || pillarIds.length === 0) return;

  await client.query("DELETE FROM core.content_pillars WHERE content_id = $1", [
    contentId,
  ]);

  const values = pillarIds.map((pid, i) => `($1, $${i + 2})`).join(", ");
  await client.query(
    `INSERT INTO core.content_pillars (content_id, pillar_id) VALUES ${values}`,
    [contentId, ...pillarIds],
  );
};

// ── Queries ───────────────────────────────────────────────────────────────────

export const getAll = async (query, user) => {
  const { limit, offset } = paginate(query);
  let sql = listSelect;
  const params = [];
  let idx = 1;

  const showDeleted = query.status === "deleted";
  const contentFilter = showDeleted
    ? "c.deleted_at IS NOT NULL AND c.is_active = false"
    : "c.deleted_at IS NULL AND c.is_active = true";

  sql += ` WHERE ${contentFilter}`;

  // Jika contract_id tidak disediakan, saring agar kontrak induknya harus aktif
  if (!query.contract_id) {
    sql += " AND co.deleted_at IS NULL AND co.is_active = true";
  }

  if (query.contract_id) {
    sql += ` AND c.contract_id = $${idx++}`;
    params.push(query.contract_id);
  }
  if (query.status && !showDeleted) {
    sql += ` AND c.status = $${idx++}`;
    params.push(query.status);
  }
  if (query.platform_id) {
    sql += ` AND c.platform_id = $${idx++}`;
    params.push(query.platform_id);
  }
  if (query.content_category_id) {
    sql += ` AND c.content_category_id = $${idx++}`;
    params.push(query.content_category_id);
  }
  if (query.pillar_id) {
    // Filter: content harus punya setidaknya satu pillar yang cocok
    sql += ` AND EXISTS (
      SELECT 1 FROM core.content_pillars cp
      WHERE cp.content_id = c.id AND cp.pillar_id = $${idx++}
    )`;
    params.push(query.pillar_id);
  }
  if (query.priority) {
    sql += ` AND c.priority = $${idx++}`;
    params.push(query.priority);
  }

  // Scoping check for non-superadmins
  if (user && !user.roles.includes("superadmin")) {
    sql += ` AND (co.created_by = $${idx} OR co.lead_by = $${idx} OR EXISTS (SELECT 1 FROM core.content_teams ct WHERE ct.content_id = c.id AND ct.user_id = $${idx}))`;
    params.push(user.id);
    idx++;
  }

  sql += ` ORDER BY c.due_date ASC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id, user) => {
  const { rows } = await pool.query(
    `${listSelect} WHERE c.id = $1 AND c.deleted_at IS NULL AND c.is_active = true`,
    [id],
  );
  const content = rows[0];
  if (!content) throw new AppError("Content not found", 404);

  // Scoping check for non-superadmins
  if (user && !user.roles.includes("superadmin")) {
    const isTeamMember = content.teams?.some(
      (t) => Number(t.id) === Number(user.id),
    );
    if (
      Number(content.contract_created_by) !== Number(user.id) &&
      Number(content.contract_lead_by) !== Number(user.id) &&
      !isTeamMember
    ) {
      throw new AppError(
        "Forbidden: You do not have access to this content",
        403,
      );
    }
  }

  return content;
};

export const create = async (data, createdBy) => {
  const {
    contract_id,
    platform_id,
    content_category_id,
    pillar_ids,
    title,
    content_url,
    objective,
    target_audience,
    description,
    due_date,
    priority,
    format,
    team_user_ids,
  } = data;

  const client = await pool.connect();
  try {
    const contractRes = await client.query(
      "SELECT created_by, lead_by, status FROM core.contracts WHERE id = $1 AND deleted_at IS NULL AND is_active = true",
      [contract_id],
    );
    const contract = contractRes.rows[0];
    if (!contract) throw new AppError("Contract not found or inactive", 404);

    if (["completed", "cancelled"].includes(contract.status?.toLowerCase())) {
      throw new AppError("Kontrak telah selesai atau dibatalkan, tidak dapat menambah rencana konten baru", 400);
    }

    if (createdBy && !createdBy.roles.includes("superadmin")) {
      const isLead =
        createdBy.roles.includes("content_lead") &&
        Number(contract.lead_by) === Number(createdBy.id);
      if (!isLead) {
        throw new AppError(
          "Forbidden: You cannot add content to this contract",
          403,
        );
      }
    }

    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO core.contents
         (contract_id, platform_id, content_category_id, title,
          content_url, objective, target_audience, description, due_date, priority, format)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        contract_id,
        platform_id,
        content_category_id,
        title,
        content_url,
        objective,
        target_audience,
        description,
        due_date,
        priority,
        format || "Video",
      ],
    );

    // Sync pillars (required — min 1)
    if (pillar_ids?.length) {
      await syncPillars(client, rows[0].id, pillar_ids);
    }

    if (team_user_ids?.length) {
      await syncTeams(client, rows[0].id, team_user_ids);
    }

    await client.query("COMMIT");

    // Kirim notifikasi ke owner
    try {
      let creatorName = "Content Lead";
      if (createdBy) {
        const creatorRes = await pool.query(
          "SELECT full_name FROM core.users WHERE id = $1",
          [createdBy.id],
        );
        if (creatorRes.rows[0]) {
          creatorName = creatorRes.rows[0].full_name;
        }
      }

      const ownersRes = await pool.query(
        `SELECT u.id 
         FROM core.users u
         JOIN core.user_roles ur ON ur.user_id = u.id
         JOIN core.roles r ON r.id = ur.role_id
         WHERE r.role_name = 'owner' AND u.deleted_at IS NULL AND u.is_active = true`,
      );

      for (const owner of ownersRes.rows) {
        if (Number(owner.id) === Number(createdBy.id)) continue;

        await createNotification(null, {
          recipient_id: owner.id,
          sender_id: createdBy.id || null,
          title: "Rencana Konten Baru Dibuat",
          message: `Rencana konten baru "${title}" telah dibuat oleh ${creatorName}.`,
          source_type: "content",
          source_id: rows[0].id,
        });
      }
    } catch (err) {
      console.error(
        "Failed to send content creation notification to owners:",
        err.message,
      );
    }

    return getById(rows[0].id, createdBy);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const update = async (id, fields, user) => {
  const allowedFields = [
    "title",
    "description",
    "status",
    "platform_id",
    "content_category_id",
    "content_url",
    "objective",
    "target_audience",
    "due_date",
    "priority",
    "published_at",
    "format",
    "scheduled_at",
  ];
  const keys = Object.keys(fields).filter((k) => allowedFields.includes(k));
  const team_user_ids = fields.team_user_ids;
  const pillar_ids = fields.pillar_ids;

  if (!keys.length && team_user_ids === undefined && pillar_ids === undefined) {
    throw new AppError("Tidak ada field valid untuk diupdate", 422);
  }

  const existing = await getById(id, user);
  await checkContractStatusByContentId(pool, id);

  if (user && !user.roles.includes("superadmin")) {
    const isOwner =
      user.roles.includes("owner") &&
      Number(existing.contract_created_by) === Number(user.id);
    const isLead =
      user.roles.includes("content_lead") &&
      Number(existing.contract_lead_by) === Number(user.id);
    const isSocialMediaAdmin = user.roles.includes("admin_social_media");
    if (!isOwner && !isLead && !isSocialMediaAdmin) {
      throw new AppError("Forbidden: You cannot modify this content", 403);
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (keys.length) {
      await updateByIdWithWhitelist(client, "core.contents", id, fields);
    }

    if (pillar_ids !== undefined) {
      await syncPillars(client, id, pillar_ids);
    }

    if (team_user_ids !== undefined) {
      await syncTeams(client, id, team_user_ids);
    }

    await client.query("COMMIT");

    if (team_user_ids !== undefined) {
      await syncContentStatus(id);
    }

    if (fields.status === "scheduled" && existing.status !== "scheduled") {
      try {
        if (
          existing.contract_lead_by &&
          Number(existing.contract_lead_by) !== Number(user?.id)
        ) {
          await createNotification(null, {
            recipient_id: existing.contract_lead_by,
            sender_id: user?.id || null,
            title: "Konten Dijadwalkan",
            message: `Rencana konten "${existing.title}" telah dijadwalkan untuk dipublikasikan.`,
            source_type: "content",
            source_id: id,
          });
        }
      } catch (err) {
        console.error(
          "Failed to send content scheduled notification:",
          err.message,
        );
      }
    }

    if (fields.scheduled_at !== undefined) {
      const oldTime = existing.scheduled_at
        ? new Date(existing.scheduled_at).getTime()
        : null;
      const newTime = fields.scheduled_at
        ? new Date(fields.scheduled_at).getTime()
        : null;
      if (newTime !== null && oldTime !== newTime) {
        try {
          if (
            existing.contract_lead_by &&
            Number(existing.contract_lead_by) !== Number(user?.id)
          ) {
            const formattedDate = new Date(fields.scheduled_at).toLocaleString(
              "id-ID",
              {
                timeZone: "Asia/Jakarta",
                dateStyle: "medium",
                timeStyle: "short",
              },
            );
            await createNotification(null, {
              recipient_id: existing.contract_lead_by,
              sender_id: user?.id || null,
              title: "Perubahan Jadwal Rilis",
              message: `Jadwal publikasi rencana konten "${existing.title}" telah diperbarui menjadi ${formattedDate} WIB.`,
              source_type: "content",
              source_id: id,
            });
          }
        } catch (err) {
          console.error(
            "Failed to send content reschedule notification:",
            err.message,
          );
        }
      }
    }

    // Send notification if status changes to published
    if (fields.status === "published" && existing.status !== "published") {
      try {
        if (
          existing.contract_lead_by &&
          Number(existing.contract_lead_by) !== Number(user?.id)
        ) {
          await createNotification(null, {
            recipient_id: existing.contract_lead_by,
            sender_id: user?.id || null,
            title: "Konten Dipublikasikan",
            message: `Konten "${existing.title}" telah berhasil dipublikasikan.`,
            source_type: "content",
            source_id: id,
          });
        }
        if (
          existing.contract_created_by &&
          Number(existing.contract_created_by) !== Number(user?.id) &&
          Number(existing.contract_created_by) !==
            Number(existing.contract_lead_by)
        ) {
          await createNotification(null, {
            recipient_id: existing.contract_created_by,
            sender_id: user?.id || null,
            title: "Konten Dipublikasikan",
            message: `Konten "${existing.title}" telah berhasil dipublikasikan.`,
            source_type: "content",
            source_id: id,
          });
        }
      } catch (err) {
        console.error(
          "Failed to send content published notification:",
          err.message,
        );
      }
    }

    return getById(id, user);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const remove = async (id, user) => {
  const content = await getById(id, user);
  if (!content) throw new AppError("Content not found", 404);
  await checkContractStatusByContentId(pool, id);

  if (user && !user.roles.includes("superadmin")) {
    const isOwner =
      user.roles.includes("owner") &&
      Number(content.contract_created_by) === Number(user.id);
    const isLead =
      user.roles.includes("content_lead") &&
      Number(content.contract_lead_by) === Number(user.id);
    if (!isOwner && !isLead) {
      throw new AppError("Forbidden: You cannot delete this content", 403);
    }
  }

  const { rowCount } = await pool.query(
    `UPDATE core.contents SET deleted_at = now(), is_active = false, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Content not found", 404);

  try {
    // 1. Notify Owners: "Rencana Konten Dihapus"
    const ownersRes = await pool.query(
      `SELECT u.id 
       FROM core.users u
       JOIN core.user_roles ur ON ur.user_id = u.id
       JOIN core.roles r ON r.id = ur.role_id
       WHERE r.role_name = 'owner' AND u.deleted_at IS NULL AND u.is_active = true`,
    );

    for (const owner of ownersRes.rows) {
      await createNotification(null, {
        recipient_id: owner.id,
        sender_id: user.id || null,
        title: "Rencana Konten Dihapus",
        message: `Rencana konten "${content.title}" telah dihapus.`,
        source_type: "content",
        source_id: id,
      });
    }

    // 2. Notify employees whose tasks are under this content
    const tasksRes = await pool.query(
      `SELECT id, title, assigned_to
       FROM core.tasks
       WHERE content_id = $1 AND deleted_at IS NULL AND is_active = true`,
      [id],
    );

    for (const task of tasksRes.rows) {
      await createNotification(null, {
        recipient_id: task.assigned_to,
        sender_id: user.id || null,
        title: "Tugas Dibatalkan/Dihapus",
        message: `Tugas Anda "${task.title}" telah dihapus/dibatalkan dari konten.`,
        source_type: "task",
        source_id: task.id,
      });
    }
  } catch (err) {
    console.error(
      "Failed to send content deletion notifications:",
      err.message,
    );
  }
};

export const publish = async (id, user) => {
  const existing = await getById(id, user);
  await checkContractStatusByContentId(pool, id);

  if (user && !user.roles.includes("superadmin")) {
    const isLead =
      user.roles.includes("content_lead") &&
      Number(existing.contract_lead_by) === Number(user.id);
    const isSocialMediaAdmin = user.roles.includes("admin_social_media");
    if (!isLead && !isSocialMediaAdmin) {
      throw new AppError("Forbidden: You cannot publish this content", 403);
    }
  }

  const { rows } = await pool.query(
    `UPDATE core.contents
     SET status = 'published', published_at = COALESCE(published_at, now()), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL AND status IN ('scheduled', 'approved')
     RETURNING *`,
    [id],
  );
  if (!rows[0])
    throw new AppError(
      "Content not found atau belum berstatus scheduled atau approved",
      422,
    );

  // Send notification to content lead and owner about content publish
  try {
    if (
      existing.contract_lead_by &&
      Number(existing.contract_lead_by) !== Number(user?.id)
    ) {
      await createNotification(null, {
        recipient_id: existing.contract_lead_by,
        sender_id: user?.id || null,
        title: "Konten Dipublikasikan",
        message: `Konten "${existing.title}" telah berhasil dipublikasikan.`,
        source_type: "content",
        source_id: id,
      });
    }
    if (
      existing.contract_created_by &&
      Number(existing.contract_created_by) !== Number(user?.id) &&
      Number(existing.contract_created_by) !== Number(existing.contract_lead_by)
    ) {
      await createNotification(null, {
        recipient_id: existing.contract_created_by,
        sender_id: user?.id || null,
        title: "Konten Dipublikasikan",
        message: `Konten "${existing.title}" telah berhasil dipublikasikan.`,
        source_type: "content",
        source_id: id,
      });
    }
  } catch (err) {
    console.error(
      "Failed to send content published notification:",
      err.message,
    );
  }

  return getById(id, user);
};

export const restore = async (id, user) => {
  await checkContractStatusByContentId(pool, id);
  const { rows: checkRows } = await pool.query(
    `SELECT c.id, co.created_by AS contract_created_by, co.lead_by AS contract_lead_by
     FROM core.contents c
     JOIN core.contracts co ON co.id = c.contract_id
     WHERE c.id = $1`,
    [id],
  );
  if (!checkRows[0]) throw new AppError("Content tidak ditemukan", 404);

  if (user && !user.roles.includes("superadmin")) {
    const isOwner =
      user.roles.includes("owner") &&
      Number(checkRows[0].contract_created_by) === Number(user.id);
    const isLead =
      user.roles.includes("content_lead") &&
      Number(checkRows[0].contract_lead_by) === Number(user.id);
    if (!isOwner && !isLead) {
      throw new AppError("Forbidden: You cannot restore this content", 403);
    }
  }

  const { rows } = await pool.query(
    `UPDATE core.contents SET is_active = true, deleted_at = NULL, updated_at = now()
     WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!rows[0]) throw new AppError("Content tidak ditemukan", 404);
  const content = await getById(id, user);

  try {
    // 1. Notify Owners: "Rencana Konten Diaktifkan Kembali"
    const ownersRes = await pool.query(
      `SELECT u.id 
       FROM core.users u
       JOIN core.user_roles ur ON ur.user_id = u.id
       JOIN core.roles r ON r.id = ur.role_id
       WHERE r.role_name = 'owner' AND u.deleted_at IS NULL AND u.is_active = true`,
    );

    for (const owner of ownersRes.rows) {
      await createNotification(null, {
        recipient_id: owner.id,
        sender_id: user.id || null,
        title: "Rencana Konten Diaktifkan Kembali",
        message: `Rencana konten "${content.title}" telah diaktifkan kembali.`,
        source_type: "content",
        source_id: id,
      });
    }

    // 2. Notify employees whose tasks are under this content
    const tasksRes = await pool.query(
      `SELECT id, title, assigned_to
       FROM core.tasks
       WHERE content_id = $1 AND deleted_at IS NULL AND is_active = true`,
      [id],
    );

    for (const task of tasksRes.rows) {
      await createNotification(null, {
        recipient_id: task.assigned_to,
        sender_id: user.id || null,
        title: "Tugas Diaktifkan Kembali",
        message: `Tugas Anda "${task.title}" telah diaktifkan kembali.`,
        source_type: "task",
        source_id: task.id,
      });
    }
  } catch (err) {
    console.error(
      "Failed to send content restoration notifications:",
      err.message,
    );
  }

  return content;
};
