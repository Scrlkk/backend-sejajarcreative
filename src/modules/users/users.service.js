import pool from "../../config/database.js";
import { hash } from "../../utils/hash.js";
import AppError from "../../utils/AppError.js";
import { paginate } from "../../utils/pagination.js";
import {
  assignUserRole,
  fetchRoleNamesByUserId,
  pickPrimaryRole,
} from "../../utils/userRoles.js";

const userListSelect = `
  SELECT u.id, u.full_name, u.email, u.is_active, u.created_at,
         COALESCE(
           (SELECT json_agg(r.role_name ORDER BY r.role_name)
            FROM core.user_roles ur
            JOIN core.roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id),
           '[]'::json
         ) AS roles
  FROM core.users u
  WHERE u.is_active = true AND u.deleted_at IS NULL
`;

const mapUser = (row) => {
  const roles = Array.isArray(row.roles)
    ? row.roles
    : typeof row.roles === "string"
      ? JSON.parse(row.roles)
      : [];
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    is_active: row.is_active,
    created_at: row.created_at,
    roles,
    role: pickPrimaryRole(roles),
  };
};

export const getAll = async (query) => {
  const { limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `${userListSelect} ORDER BY u.id LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return rows.map(mapUser);
};

export const getById = async (id) => {
  const { rows } = await pool.query(
    `${userListSelect} AND u.id = $1`,
    [id],
  );
  if (!rows[0]) throw new AppError("User not found", 404);
  return mapUser(rows[0]);
};

export const create = async ({ full_name, email, password, role }) => {
  const hashed = await hash(password);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO core.users (full_name, email, password)
       VALUES ($1,$2,$3) RETURNING id, full_name, email, created_at`,
      [full_name, email, hashed],
    );
    if (role) {
      await assignUserRole(rows[0].id, role, client);
    }
    await client.query("COMMIT");
    const roles = await fetchRoleNamesByUserId(rows[0].id);
    return { ...rows[0], roles, role: pickPrimaryRole(roles) };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const update = async (id, fields) => {
  const { role, ...userFields } = fields;
  const { rows: userCheck } = await pool.query(
    "SELECT id FROM core.users WHERE id = $1 AND is_active = true AND deleted_at IS NULL",
    [id],
  );
  if (!userCheck[0])
    throw new AppError("User tidak ditemukan atau tidak aktif", 404);

  if (userFields.password) userFields.password = await hash(userFields.password);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const allowedFields = ["full_name", "email", "password"];
    const keys = Object.keys(userFields).filter((k) => allowedFields.includes(k));

    if (keys.length) {
      const values = keys.map((k) => userFields[k]);
      const set = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      await client.query(
        `UPDATE core.users SET ${set}, updated_at = now()
         WHERE id = $${keys.length + 1} RETURNING id`,
        [...values, id],
      );
    }

    if (role) {
      await client.query("DELETE FROM core.user_roles WHERE user_id = $1", [id]);
      await assignUserRole(id, role, client);
    }

    if (userFields.password) {
      await client.query("DELETE FROM auth.refresh_tokens WHERE user_id = $1", [id]);
    }

    if (!keys.length && !role) {
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
  const { rows } = await pool.query(
    `UPDATE core.users SET is_active = false, deleted_at = now(), updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id],
  );
  if (!rows[0]) throw new AppError("User not found", 404);
};

export const restore = async (id) => {
  const { rows } = await pool.query(
    `UPDATE core.users SET is_active = true, deleted_at = NULL, updated_at = now()
     WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!rows[0]) throw new AppError("User tidak ditemukan", 404);
  return getById(id);
};
