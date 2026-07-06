import pool from "#config/database.js";
import AppError from "#utils/AppError.js";
import { paginate } from "#utils/pagination.js";
import { updateByIdWithWhitelist } from "#utils/dbHelper.js";
import { createNotification } from "../notifications/notifications.service.js";

const selectContractsBase = `
  SELECT c.*, cl.client_name, cl.company_name,
         u1.full_name AS created_by_name,
         u2.full_name AS lead_by_name,
         COALESCE(
           (SELECT json_agg(json_build_object('id', pl.id, 'platform_name', pl.platform_name))
            FROM core.contracts_platforms cp
            JOIN core.platforms pl ON pl.id = cp.platform_id
            WHERE cp.contract_id = c.id),
           '[]'::json
         ) AS platforms,
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
            FROM core.contract_teams ct
            JOIN core.users u ON u.id = ct.user_id
            WHERE ct.contract_id = c.id),
           '[]'::json
         ) AS teams
  FROM core.contracts c
  JOIN core.clients cl ON cl.id = c.client_id AND cl.deleted_at IS NULL AND cl.is_active = true
  JOIN core.users u1 ON u1.id = c.created_by
  JOIN core.users u2 ON u2.id = c.lead_by
`;

const notDeleted = "c.deleted_at IS NULL AND c.is_active = true";

const syncPlatforms = async (client, contractId, platformIds) => {
  if (!Array.isArray(platformIds)) return;
  await client.query(
    "DELETE FROM core.contracts_platforms WHERE contract_id = $1",
    [contractId],
  );
  if (!platformIds.length) return;
  const values = platformIds.map((pid, i) => `($1, $${i + 2})`).join(", ");
  await client.query(
    `INSERT INTO core.contracts_platforms (contract_id, platform_id) VALUES ${values}`,
    [contractId, ...platformIds],
  );
};

const syncTeams = async (client, contractId, userIds) => {
  if (!Array.isArray(userIds)) return { addedUsers: [], removedUsers: [] };

  const { rows: existingRows } = await client.query(
    "SELECT user_id FROM core.contract_teams WHERE contract_id = $1",
    [contractId]
  );
  const existingUserIds = existingRows.map(row => Number(row.user_id));
  const newUserIds = userIds.map(Number);

  const addedUsers = newUserIds.filter(uid => !existingUserIds.includes(uid));
  const removedUsers = existingUserIds.filter(uid => !newUserIds.includes(uid));

  await client.query("DELETE FROM core.contract_teams WHERE contract_id = $1", [
    contractId,
  ]);

  if (userIds.length > 0) {
    const values = userIds.map((uid, i) => `($1, $${i + 2})`).join(", ");
    await client.query(
      `INSERT INTO core.contract_teams (contract_id, user_id) VALUES ${values}`,
      [contractId, ...userIds],
    );
  }

  return { addedUsers, removedUsers };
};

export const getAll = async (query, user) => {
  const { limit, offset } = paginate(query);
  const showDeleted = query.status === "deleted";
  const contractFilter = showDeleted
    ? "c.deleted_at IS NOT NULL AND c.is_active = false"
    : "c.deleted_at IS NULL AND c.is_active = true";

  let sql = selectContractsBase + ` WHERE ${contractFilter}`;
  const params = [];
  let idx = 1;
  if (query.client_id) {
    sql += ` AND c.client_id = $${idx++}`;
    params.push(query.client_id);
  }
  if (query.status && !showDeleted) {
    sql += ` AND c.status = $${idx++}`;
    params.push(query.status);
  }

  // Scoping check for non-superadmins
  if (user && !user.roles.includes("superadmin")) {
    sql += ` AND (c.created_by = $${idx} OR c.lead_by = $${idx} OR EXISTS (SELECT 1 FROM core.contract_teams ct WHERE ct.contract_id = c.id AND ct.user_id = $${idx}))`;
    params.push(user.id);
    idx++;
  }

  sql += ` ORDER BY c.id DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id, user) => {
  const { rows } = await pool.query(
    `${selectContractsBase} WHERE c.id = $1 AND c.deleted_at IS NULL AND c.is_active = true`,
    [id],
  );
  const contract = rows[0];
  if (!contract) throw new AppError("Contract not found", 404);

  // Scoping check for non-superadmins
  if (user && !user.roles.includes("superadmin")) {
    const isTeamMember = contract.teams?.some(t => Number(t.id) === Number(user.id));
    if (
      Number(contract.created_by) !== Number(user.id) &&
      Number(contract.lead_by) !== Number(user.id) &&
      !isTeamMember
    ) {
      throw new AppError("Forbidden: You do not have access to this contract", 403);
    }
  }

  return contract;
};

export const create = async (data, createdBy) => {
  const {
    client_id,
    contract_code,
    contract_name,
    description,
    start_date,
    end_date,
    revenue,
    lead_by,
    platform_ids,
    team_user_ids,
  } = data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO core.contracts
         (client_id, contract_code, contract_name, description, start_date, end_date, revenue, lead_by, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        client_id,
        contract_code,
        contract_name,
        description,
        start_date,
        end_date,
        revenue,
        lead_by,
        createdBy.id,
      ],
    );

    let syncResult = { addedUsers: [], removedUsers: [] };
    if (platform_ids?.length) {
      await syncPlatforms(client, rows[0].id, platform_ids);
    }
    if (team_user_ids?.length) {
      syncResult = await syncTeams(client, rows[0].id, team_user_ids);
    }

    await client.query("COMMIT");
    const contract = await getById(rows[0].id, createdBy);

    try {
      await createNotification(null, {
        recipient_id: lead_by,
        sender_id: createdBy.id,
        title: "Kontrak Baru Ditugaskan",
        message: `Anda telah ditugaskan sebagai Content Lead untuk kontrak "${contract_name}" (${contract_code}).`,
        source_type: "contract",
        source_id: contract.id,
      });


      // Ambil seluruh user dengan role 'owner' yang aktif
      const ownersRes = await pool.query(
        `SELECT u.id 
         FROM core.users u
         JOIN core.user_roles ur ON ur.user_id = u.id
         JOIN core.roles r ON r.id = ur.role_id
         WHERE r.role_name = 'owner' AND u.deleted_at IS NULL AND u.is_active = true`
      );

      for (const owner of ownersRes.rows) {
        // Jangan kirim notifikasi ke diri sendiri jika pembuatnya adalah owner tersebut
        if (Number(owner.id) === Number(createdBy.id)) continue;

        await createNotification(null, {
          recipient_id: owner.id,
          sender_id: createdBy.id,
          title: "Kontrak Baru Dibuat",
          message: `Kontrak "${contract.contract_name}" (${contract.contract_code}) telah dibuat oleh ${contract.created_by_name}.`,
          source_type: "contract",
          source_id: contract.id,
        });
      }
    } catch (err) {
      console.error("Failed to send contract assignment, team, or owner notifications:", err.message);
    }

    return contract;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const update = async (id, fields, user) => {
  const { platform_ids, team_user_ids, ...rest } = fields;
  const allowedFields = [
    "contract_name",
    "contract_code",
    "description",
    "status",
    "start_date",
    "end_date",
    "revenue",
    "lead_by",
  ];
  const keys = Object.keys(rest).filter((k) => allowedFields.includes(k));

  const client = await pool.connect();
  try {
    const existing = await getById(id, user);
    const oldLeadBy = existing.lead_by;

    if (user && !user.roles.includes("superadmin")) {
      const isOwner = user.roles.includes("owner") && Number(existing.created_by) === Number(user.id);
      const isContractLead = user.roles.includes("content_lead") && Number(existing.lead_by) === Number(user.id);
      if (!isOwner && !isContractLead) {
        throw new AppError("Forbidden: You cannot modify this contract", 403);
      }
    }

    await client.query("BEGIN");

    if (keys.length) {
      await updateByIdWithWhitelist(client, "core.contracts", id, rest);
    }

    let syncResult = { addedUsers: [], removedUsers: [] };
    if (platform_ids !== undefined) {
      await syncPlatforms(client, id, platform_ids);
    }
    if (team_user_ids !== undefined) {
      syncResult = await syncTeams(client, id, team_user_ids);
    }

    if (
      !keys.length &&
      platform_ids === undefined &&
      team_user_ids === undefined
    ) {
      throw new AppError("Tidak ada field valid untuk diupdate", 422);
    }

    await client.query("COMMIT");
    const updatedContract = await getById(id, user);


    if (fields.lead_by && Number(fields.lead_by) !== Number(oldLeadBy)) {
      try {
        await createNotification(null, {
          recipient_id: fields.lead_by,
          sender_id: user.id,
          title: "Penugasan Content Lead",
          message: `Anda telah ditugaskan sebagai Content Lead baru untuk kontrak "${updatedContract.contract_name}" (${updatedContract.contract_code}).`,
          source_type: "contract",
          source_id: id,
        });
      } catch (err) {
        console.error("Failed to send contract lead update notification:", err.message);
      }
    }

    return updatedContract;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const remove = async (id, user) => {
  const contract = await getById(id, user);
  if (!contract) throw new AppError("Contract not found", 404);

  if (user && !user.roles.includes("superadmin")) {
    const isOwner = user.roles.includes("owner") && Number(contract.created_by) === Number(user.id);
    if (!isOwner) {
      throw new AppError("Forbidden: You cannot delete this contract", 403);
    }
  }

  const { rowCount } = await pool.query(
    `UPDATE core.contracts SET deleted_at = now(), is_active = false, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Contract not found", 404);

  try {
    // 1. Notify Content Leads: "Kontrak Dihapus"
    const contentLeadsRes = await pool.query(
      `SELECT ur.user_id
       FROM core.user_roles ur
       JOIN core.roles r ON r.id = ur.role_id
       WHERE r.role_name = 'content_lead'`
    );

    for (const row of contentLeadsRes.rows) {
      await createNotification(null, {
        recipient_id: row.user_id,
        sender_id: user.id || null,
        title: "Kontrak Dihapus",
        message: `Kontrak "${contract.title}" telah dihapus.`,
        source_type: "contract",
        source_id: id,
      });
    }

    // 2. Notify employees whose tasks are under contents of this contract
    const tasksRes = await pool.query(
      `SELECT DISTINCT t.id, t.title, t.assigned_to
       FROM core.tasks t
       JOIN core.contents c ON c.id = t.content_id
       WHERE c.contract_id = $1 AND t.deleted_at IS NULL AND t.is_active = true`,
      [id]
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
    console.error("Failed to send contract deletion notifications:", err.message);
  }
};

export const restore = async (id, user) => {
  const { rows: checkRows } = await pool.query(
    "SELECT created_by FROM core.contracts WHERE id = $1",
    [id],
  );
  if (!checkRows[0]) throw new AppError("Contract tidak ditemukan", 404);

  if (user && !user.roles.includes("superadmin")) {
    const isOwner = user.roles.includes("owner") && Number(checkRows[0].created_by) === Number(user.id);
    if (!isOwner) {
      throw new AppError("Forbidden: You cannot restore this contract", 403);
    }
  }

  const { rows } = await pool.query(
    `UPDATE core.contracts SET is_active = true, deleted_at = NULL, updated_at = now()
     WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!rows[0]) throw new AppError("Contract tidak ditemukan", 404);
  const contract = await getById(id, user);

  try {
    // 1. Notify Content Leads: "Kontrak Diaktifkan Kembali"
    const contentLeadsRes = await pool.query(
      `SELECT ur.user_id
       FROM core.user_roles ur
       JOIN core.roles r ON r.id = ur.role_id
       WHERE r.role_name = 'content_lead'`
    );

    for (const row of contentLeadsRes.rows) {
      await createNotification(null, {
        recipient_id: row.user_id,
        sender_id: user.id || null,
        title: "Kontrak Diaktifkan Kembali",
        message: `Kontrak "${contract.title}" telah diaktifkan kembali.`,
        source_type: "contract",
        source_id: id,
      });
    }

    // 2. Notify employees whose tasks are restored
    const tasksRes = await pool.query(
      `SELECT DISTINCT t.id, t.title, t.assigned_to
       FROM core.tasks t
       JOIN core.contents c ON c.id = t.content_id
       WHERE c.contract_id = $1 AND t.deleted_at IS NULL AND t.is_active = true`,
      [id]
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
    console.error("Failed to send contract restoration notifications:", err.message);
  }

  return contract;
};
