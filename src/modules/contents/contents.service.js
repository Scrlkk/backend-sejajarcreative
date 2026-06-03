import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

const listSelect = `
  SELECT c.*, ct.type_name, co.contract_name,
         COALESCE(
           (SELECT json_agg(json_build_object('id', pl.id, 'platform_name', pl.platform_name))
            FROM core.contents_platforms cp
            JOIN core.platforms pl ON pl.id = cp.platform_id
            WHERE cp.content_id = c.id),
           '[]'::json
         ) AS platforms
  FROM core.contents c
  JOIN core.content_types ct ON ct.id = c.content_type_id
  JOIN core.contracts co ON co.id = c.contract_id
  WHERE c.deleted_at IS NULL
`;

const syncPlatforms = async (client, contentId, platformIds) => {
  if (!Array.isArray(platformIds)) return;
  await client.query(
    "DELETE FROM core.contents_platforms WHERE content_id = $1",
    [contentId],
  );
  if (!platformIds.length) return;
  const values = platformIds
    .map((pid, i) => `($1, $${i + 2})`)
    .join(", ");
  await client.query(
    `INSERT INTO core.contents_platforms (content_id, platform_id) VALUES ${values}`,
    [contentId, ...platformIds],
  );
};

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = listSelect;
  const params = [];
  let idx = 1;
  if (query.contract_id) {
    sql += ` AND c.contract_id = $${idx++}`;
    params.push(query.contract_id);
  }
  if (query.status) {
    sql += ` AND c.status = $${idx++}`;
    params.push(query.status);
  }
  if (query.content_type_id) {
    sql += ` AND c.content_type_id = $${idx++}`;
    params.push(query.content_type_id);
  }
  sql += ` ORDER BY c.publish_date ASC NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(`${listSelect} AND c.id = $1`, [id]);
  if (!rows[0]) throw new AppError("Content not found", 404);
  return rows[0];
};

export const create = async (data) => {
  const {
    contract_id,
    content_type_id,
    title,
    file_url,
    description,
    publish_date,
    platform_ids,
  } = data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO core.contents
         (contract_id, content_type_id, title, file_url, description, publish_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [contract_id, content_type_id, title, file_url, description, publish_date],
    );
    if (platform_ids?.length) {
      await syncPlatforms(client, rows[0].id, platform_ids);
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
  const { platform_ids, ...rest } = fields;
  const allowedFields = [
    "title",
    "description",
    "status",
    "content_type_id",
    "file_url",
    "publish_date",
    "published_at",
  ];
  const keys = Object.keys(rest).filter((k) => allowedFields.includes(k));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (keys.length) {
      const values = keys.map((k) => rest[k]);
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const { rows } = await client.query(
        `UPDATE core.contents SET ${set}, updated_at = now()
         WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING id`,
        [...values, id],
      );
      if (!rows[0]) throw new AppError("Content not found", 404);
    }

    if (platform_ids !== undefined) {
      await syncPlatforms(client, id, platform_ids);
    }

    if (!keys.length && platform_ids === undefined) {
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
    `UPDATE core.contents SET deleted_at = now(), is_active = false, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Content not found", 404);
};

export const publish = async (id) => {
  const { rows } = await pool.query(
    `UPDATE core.contents
     SET status = 'published', published_at = COALESCE(published_at, now()), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL AND status = 'approved'
     RETURNING *`,
    [id],
  );
  if (!rows[0]) throw new AppError("Content not found atau belum berstatus approved", 422);
  return getById(id);
};
