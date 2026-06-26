import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";
import { createNotification } from "../notifications/notifications.service.js";

const listSelect = `
  SELECT c.*,
         pl.platform_name,
         pl.color_key AS platform_color_key,
         cc.type_name AS category_name,
         cc.color_key AS category_color_key,
         co.contract_name,
         co.contract_code,
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
              'roles', COALESCE(
                (SELECT json_agg(r.role_name ORDER BY r.role_name)
                 FROM core.user_roles ur
                 JOIN core.roles r ON r.id = ur.role_id
                 WHERE ur.user_id = u.id),
                '[]'::json
              )
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

// ── Sync helpers ──────────────────────────────────────────────────────────────

const syncTeams = async (client, contentId, userIds) => {
  if (!Array.isArray(userIds)) return { addedUsers: [], removedUsers: [] };

  const { rows: existingRows } = await client.query(
    "SELECT user_id FROM core.content_teams WHERE content_id = $1",
    [contentId]
  );
  const existingUserIds = existingRows.map(row => Number(row.user_id));
  const newUserIds = userIds.map(Number);

  const addedUsers = newUserIds.filter(uid => !existingUserIds.includes(uid));
  const removedUsers = existingUserIds.filter(uid => !newUserIds.includes(uid));

  await client.query("DELETE FROM core.content_teams WHERE content_id = $1", [
    contentId,
  ]);

  if (userIds.length > 0) {
    const values = userIds.map((uid, i) => `($1, $${i + 2})`).join(", ");
    await client.query(
      `INSERT INTO core.content_teams (content_id, user_id) VALUES ${values}`,
      [contentId, ...userIds],
    );
  }

  return { addedUsers, removedUsers };
};

const syncPillars = async (client, contentId, pillarIds) => {
  if (!Array.isArray(pillarIds) || pillarIds.length === 0) return;

  await client.query(
    "DELETE FROM core.content_pillars WHERE content_id = $1",
    [contentId]
  );

  const values = pillarIds.map((pid, i) => `($1, $${i + 2})`).join(", ");
  await client.query(
    `INSERT INTO core.content_pillars (content_id, pillar_id) VALUES ${values}`,
    [contentId, ...pillarIds]
  );
};

// ── Queries ───────────────────────────────────────────────────────────────────

export const getAll = async (query) => {
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
  sql += ` ORDER BY c.due_date ASC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `${listSelect} WHERE c.id = $1 AND c.deleted_at IS NULL AND c.is_active = true`,
    [id],
  );
  if (!rows[0]) throw new AppError("Content not found", 404);
  return rows[0];
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
        format || 'Video',
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
          [createdBy]
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
         WHERE r.role_name = 'owner' AND u.deleted_at IS NULL AND u.is_active = true`
      );

      for (const owner of ownersRes.rows) {
        if (Number(owner.id) === Number(createdBy)) continue;

        await createNotification(null, {
          recipient_id: owner.id,
          sender_id: createdBy || null,
          title: "Rencana Konten Baru Dibuat",
          message: `Rencana konten baru "${title}" telah dibuat oleh ${creatorName}.`,
          source_type: "content",
          source_id: rows[0].id,
        });
      }
    } catch (err) {
      console.error("Failed to send content creation notification to owners:", err.message);
    }

    return getById(rows[0].id);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const update = async (id, fields) => {
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (keys.length) {
      const values = keys.map((k) => fields[k]);
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const { rows } = await client.query(
        `UPDATE core.contents SET ${set}, updated_at = now()
         WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING id`,
        [...values, id],
      );
      if (!rows[0]) throw new AppError("Content not found", 404);
    }

    if (pillar_ids !== undefined) {
      await syncPillars(client, id, pillar_ids);
    }

    if (team_user_ids !== undefined) {
      await syncTeams(client, id, team_user_ids);
    }

    await client.query("COMMIT");
    return getById(id);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const remove = async (id, deletedBy) => {
  const content = await getById(id);
  if (!content) throw new AppError("Content not found", 404);

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
       WHERE r.role_name = 'owner' AND u.deleted_at IS NULL AND u.is_active = true`
    );

    for (const owner of ownersRes.rows) {
      await createNotification(null, {
        recipient_id: owner.id,
        sender_id: deletedBy || null,
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
      [id]
    );

    for (const task of tasksRes.rows) {
      await createNotification(null, {
        recipient_id: task.assigned_to,
        sender_id: deletedBy || null,
        title: "Tugas Dibatalkan/Dihapus",
        message: `Tugas Anda "${task.title}" telah dihapus/dibatalkan dari konten.`,
        source_type: "task",
        source_id: task.id,
      });
    }
  } catch (err) {
    console.error("Failed to send content deletion notifications:", err.message);
  }
};

export const publish = async (id) => {
  const { rows } = await pool.query(
    `UPDATE core.contents
     SET status = 'published', published_at = COALESCE(published_at, now()), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL AND status IN ('scheduled', 'approved')
     RETURNING *`,
    [id],
  );
  if (!rows[0])
    throw new AppError("Content not found atau belum berstatus scheduled atau approved", 422);
  return getById(id);
};

export const restore = async (id, restoredBy) => {
  const { rows } = await pool.query(
    `UPDATE core.contents SET is_active = true, deleted_at = NULL, updated_at = now()
     WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!rows[0]) throw new AppError("Content tidak ditemukan", 404);
  const content = await getById(id);

  try {
    // 1. Notify Owners: "Rencana Konten Diaktifkan Kembali"
    const ownersRes = await pool.query(
      `SELECT u.id 
       FROM core.users u
       JOIN core.user_roles ur ON ur.user_id = u.id
       JOIN core.roles r ON r.id = ur.role_id
       WHERE r.role_name = 'owner' AND u.deleted_at IS NULL AND u.is_active = true`
    );

    for (const owner of ownersRes.rows) {
      await createNotification(null, {
        recipient_id: owner.id,
        sender_id: restoredBy || null,
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
      [id]
    );

    for (const task of tasksRes.rows) {
      await createNotification(null, {
        recipient_id: task.assigned_to,
        sender_id: restoredBy || null,
        title: "Tugas Diaktifkan Kembali",
        message: `Tugas Anda "${task.title}" telah diaktifkan kembali.`,
        source_type: "task",
        source_id: task.id,
      });
    }
  } catch (err) {
    console.error("Failed to send content restoration notifications:", err.message);
  }

  return content;
};
