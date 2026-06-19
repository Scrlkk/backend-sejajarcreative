import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";
import { pickPrimaryRole } from "../../utils/userRoles.js";

const mapTask = (row) => {
  if (!row) return row;
  const roles = Array.isArray(row.assignee_roles)
    ? row.assignee_roles
    : typeof row.assignee_roles === "string"
      ? JSON.parse(row.assignee_roles)
      : [];
  return {
    ...row,
    assignee_roles: roles,
    assignee_role: pickPrimaryRole(roles),
  };
};

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = `
    SELECT t.*, c.title AS content_title, c.contract_id,
           u.full_name AS assignee_name, ct.contract_name,
           p.pillar_name, pl.platform_name, cc.type_name AS category_name,
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
    LEFT JOIN core.pillars p ON p.id = c.pillar_id
    LEFT JOIN core.platforms pl ON pl.id = c.platform_id
    LEFT JOIN core.content_category cc ON cc.id = c.content_category_id
    WHERE t.deleted_at IS NULL AND t.is_active = true
  `;
  const params = [];
  let idx = 1;

  // Jika tidak mem-filter content_id atau contract_id tertentu, saring agar induknya harus aktif
  if (!query.content_id && !query.contract_id) {
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
  if (query.status) {
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
    `SELECT t.*, c.title AS content_title, c.contract_id,
            u.full_name AS assignee_name, ct.contract_name,
            p.pillar_name, pl.platform_name, cc.type_name AS category_name,
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
     LEFT JOIN core.pillars p ON p.id = c.pillar_id
     LEFT JOIN core.platforms pl ON pl.id = c.platform_id
     LEFT JOIN core.content_category cc ON cc.id = c.content_category_id
     WHERE t.id = $1 AND t.deleted_at IS NULL AND t.is_active = true`,
    [id],
  );
  if (!rows[0]) throw new AppError("Task not found", 404);
  return mapTask(rows[0]);
};

export const create = async ({
  content_id,
  assigned_to,
  title,
  description,
  deadline,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO core.tasks (content_id, assigned_to, title, description, deadline)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [content_id, assigned_to, title, description, deadline],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  const allowedFields = [
    "title",
    "description",
    "status",
    "deadline",
    "assigned_to",
  ];
  const keys = Object.keys(fields).filter((k) => allowedFields.includes(k));
  if (!keys.length)
    throw new AppError("Tidak ada field valid untuk diupdate", 422);

  const values = keys.map((k) => fields[k]);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.tasks SET ${set}, updated_at = now()
     WHERE id = $${keys.length + 1} AND deleted_at IS NULL RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Task not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    `UPDATE core.tasks SET deleted_at = now(), is_active = false, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rowCount) throw new AppError("Task not found", 404);
};
