import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

const listSelect = `
  SELECT c.*,
         pl.platform_name,
         cc.type_name AS category_name,
         p.pillar_name,
         co.contract_name,
         co.contract_code
  FROM core.contents c
  JOIN core.platforms pl ON pl.id = c.platform_id
  JOIN core.content_category cc ON cc.id = c.content_category_id
  JOIN core.pillars p ON p.id = c.pillar_id AND p.is_active = true
  JOIN core.contracts co ON co.id = c.contract_id
  WHERE c.deleted_at IS NULL AND c.is_active = true
`;

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = listSelect;
  const params = [];
  let idx = 1;

  // Jika contract_id tidak disediakan, saring agar kontrak induknya harus aktif
  if (!query.contract_id) {
    sql += " AND co.deleted_at IS NULL AND co.is_active = true";
  }

  if (query.contract_id) {
    sql += ` AND c.contract_id = $${idx++}`;
    params.push(query.contract_id);
  }
  if (query.status) {
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
    sql += ` AND c.pillar_id = $${idx++}`;
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
  const { rows } = await pool.query(`${listSelect} AND c.id = $1`, [id]);
  if (!rows[0]) throw new AppError("Content not found", 404);
  return rows[0];
};

export const create = async (data) => {
  const {
    contract_id,
    platform_id,
    content_category_id,
    pillar_id,
    title,
    content_url,
    objective,
    target_audience,
    description,
    due_date,
    priority,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO core.contents
       (contract_id, platform_id, content_category_id, pillar_id, title,
        content_url, objective, target_audience, description, due_date, priority)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      contract_id,
      platform_id,
      content_category_id,
      pillar_id,
      title,
      content_url,
      objective,
      target_audience,
      description,
      due_date,
      priority,
    ],
  );
  return getById(rows[0].id);
};

export const update = async (id, fields) => {
  const allowedFields = [
    "title",
    "description",
    "status",
    "platform_id",
    "content_category_id",
    "pillar_id",
    "content_url",
    "objective",
    "target_audience",
    "due_date",
    "priority",
    "published_at",
  ];
  const keys = Object.keys(fields).filter((k) => allowedFields.includes(k));
  if (!keys.length)
    throw new AppError("Tidak ada field valid untuk diupdate", 422);

  const values = keys.map((k) => fields[k]);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.contents SET ${set}, updated_at = now()
     WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Content not found", 404);
  return getById(id);
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
  if (!rows[0])
    throw new AppError("Content not found atau belum berstatus approved", 422);
  return getById(id);
};
