import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

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
  if (!Array.isArray(userIds)) return;
  await client.query("DELETE FROM core.contract_teams WHERE contract_id = $1", [
    contractId,
  ]);
  if (!userIds.length) return;
  const values = userIds.map((uid, i) => `($1, $${i + 2})`).join(", ");
  await client.query(
    `INSERT INTO core.contract_teams (contract_id, user_id) VALUES ${values}`,
    [contractId, ...userIds],
  );
};

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  const showDeleted = query.status === "deleted";
  const contractFilter = showDeleted
    ? "c.deleted_at IS NOT NULL AND c.is_active = false"
    : "c.deleted_at IS NULL AND c.is_active = true";

  let sql = `SELECT c.*, cl.client_name,
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
                      (SELECT json_agg(json_build_object('id', u.id, 'full_name', u.full_name))
                       FROM core.contract_teams ct
                       JOIN core.users u ON u.id = ct.user_id
                       WHERE ct.contract_id = c.id),
                      '[]'::json
                    ) AS teams
             FROM core.contracts c
             JOIN core.clients cl ON cl.id = c.client_id AND cl.deleted_at IS NULL AND cl.is_active = true
             JOIN core.users u1 ON u1.id = c.created_by
             JOIN core.users u2 ON u2.id = c.lead_by
             WHERE ${contractFilter}`;
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
  sql += ` ORDER BY c.id DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT c.*, cl.client_name,
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
              (SELECT json_agg(json_build_object('id', u.id, 'full_name', u.full_name))
               FROM core.contract_teams ct
               JOIN core.users u ON u.id = ct.user_id
               WHERE ct.contract_id = c.id),
              '[]'::json
            ) AS teams
     FROM core.contracts c
     JOIN core.clients cl ON cl.id = c.client_id AND cl.deleted_at IS NULL AND cl.is_active = true
     JOIN core.users u1 ON u1.id = c.created_by
     JOIN core.users u2 ON u2.id = c.lead_by
     WHERE c.id = $1 AND c.deleted_at IS NULL AND c.is_active = true`,
    [id],
  );
  if (!rows[0]) throw new AppError("Contract not found", 404);
  return rows[0];
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
        createdBy,
      ],
    );

    if (platform_ids?.length) {
      await syncPlatforms(client, rows[0].id, platform_ids);
    }
    if (team_user_ids?.length) {
      await syncTeams(client, rows[0].id, team_user_ids);
    }

    await client.query("COMMIT");
    return getById(rows[0].id);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const update = async (id, fields) => {
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
    await client.query("BEGIN");

    if (keys.length) {
      const values = keys.map((k) => rest[k]);
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const { rows } = await client.query(
        `UPDATE core.contracts SET ${set}, updated_at = now()
         WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING id`,
        [...values, id],
      );
      if (!rows[0]) throw new AppError("Contract not found", 404);
    }

    if (platform_ids !== undefined) {
      await syncPlatforms(client, id, platform_ids);
    }
    if (team_user_ids !== undefined) {
      await syncTeams(client, id, team_user_ids);
    }

    if (
      !keys.length &&
      platform_ids === undefined &&
      team_user_ids === undefined
    ) {
      throw new AppError("Tidak ada field valid untuk diupdate", 422);
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

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    `UPDATE core.contracts SET deleted_at = now(), is_active = false, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Contract not found", 404);
};
