import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  let sql = `SELECT p.*, c.client_name, u.full_name AS created_by_name
             FROM core.projects p
             JOIN core.clients c ON c.id = p.client_id
             JOIN core.users u ON u.id = p.created_by
             WHERE 1=1`;
  const params = [];
  let idx = 1;
  if (query.client_id) {
    sql += ` AND p.client_id = $${idx++}`;
    params.push(query.client_id);
  }
  if (query.status) {
    sql += ` AND p.status = $${idx++}`;
    params.push(query.status);
  }
  sql += ` ORDER BY p.id DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);
  const { rows } = await pool.query(sql, params);
  return rows;
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `SELECT p.*, c.client_name, u.full_name AS created_by_name
     FROM core.projects p
     JOIN core.clients c ON c.id = p.client_id
     JOIN core.users u ON u.id = p.created_by
     WHERE p.id = $1`,
    [id],
  );
  if (!rows[0]) throw new AppError("Project not found", 404);
  return rows[0];
};

export const create = async (data, createdBy) => {
  const { client_id, project_name, description, start_date, end_date } = data;
  const { rows } = await pool.query(
    "INSERT INTO core.projects (client_id, project_name, description, start_date, end_date, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [client_id, project_name, description, start_date, end_date, createdBy],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const { rows } = await pool.query(
    `UPDATE core.projects SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id],
  );
  if (!rows[0]) throw new AppError("Project not found", 404);
  return rows[0];
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(
    "DELETE FROM core.projects WHERE id = $1",
    [id],
  );
  if (!rowCount) throw new AppError("Project not found", 404);
};

export const getMembers = async (projectId) => {
  const { rows } = await pool.query(
    `SELECT pm.*, u.full_name, u.email, u.role
     FROM core.project_members pm
     JOIN core.users u ON u.id = pm.user_id
     WHERE pm.project_id = $1`,
    [projectId],
  );
  return rows;
};

export const addMember = async (projectId, { user_id, role_in_project }) => {
  const { rows } = await pool.query(
    "INSERT INTO core.project_members (project_id, user_id, role_in_project) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING *",
    [projectId, user_id, role_in_project],
  );
  return rows[0];
};

export const removeMember = async (projectId, userId) => {
  const { rowCount } = await pool.query(
    "DELETE FROM core.project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId],
  );
  if (!rowCount)
    throw new AppError("Member tidak ditemukan di project ini", 404);
};
