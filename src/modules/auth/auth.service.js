import pool from "../../config/database.js";
import logger from "../../config/logger.js";
import { compare } from "../../utils/hash.js";
import { signAccess, signRefresh, verifyRefresh } from "../../utils/jwt.js";
import AppError from "../../utils/AppError.js";
import {
  fetchRoleNamesByUserId,
  pickPrimaryRole,
} from "../../utils/userRoles.js";

/**
 * Fire-and-forget insert ke audit.activity_logs.
 * Tidak pernah throw — error hanya di-log.
 */
const logActivity = (userId, action, extra = {}) => {
  pool
    .query(
      `INSERT INTO audit.activity_logs
         (user_id, action, table_name, ip_address, user_agent)
         VALUES ($1,$2,$3,$4,$5)`,
      [
        userId,
        action,
        'core.users',
        extra.ip   || null,
        extra.ua   || null,
      ],
    )
    .catch((err) =>
      logger.error('[Auth] Failed to write activity log', {
        error: err.message,
        userId,
        action,
      }),
    );
};

const buildTokenPayload = async (userId, email) => {
  const roles = await fetchRoleNamesByUserId(userId);
  const role = pickPrimaryRole(roles);
  return { id: userId, email, role, roles };
};

export const login = async (email, password, extra = {}) => {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, password, is_active FROM core.users WHERE email = $1 AND deleted_at IS NULL",
    [email],
  );
  const user = rows[0];
  if (!user || !(await compare(password, user.password)))
    throw new AppError("Invalid credentials", 401);

  if (!user.is_active) throw new AppError("User account is inactive", 403);

  const roles = await fetchRoleNamesByUserId(user.id);
  if (!roles.length) throw new AppError("User has no assigned role", 403);

  const payload = await buildTokenPayload(user.id, user.email);
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await pool.query(
    "INSERT INTO auth.refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)",
    [user.id, refreshToken, expiresAt],
  );

  logActivity(user.id, 'LOGIN', extra);

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: payload.role,
      roles: payload.roles,
    },
    accessToken,
    refreshToken,
  };
};

export const refresh = async (token) => {
  let decoded;
  try {
    decoded = verifyRefresh(token);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const { rows } = await pool.query(
    `SELECT rt.*, u.id AS user_id, u.email, u.is_active
     FROM auth.refresh_tokens rt
     JOIN core.users u ON u.id = rt.user_id
     WHERE rt.token = $1 AND rt.expires_at > now() AND u.deleted_at IS NULL`,
    [token],
  );
  if (!rows[0]) throw new AppError("Refresh token not found", 401);

  if (!rows[0].is_active) throw new AppError("User account is inactive", 403);

  await pool.query("DELETE FROM auth.refresh_tokens WHERE token = $1", [token]);

  const payload = await buildTokenPayload(rows[0].user_id, rows[0].email);
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await pool.query(
    "INSERT INTO auth.refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)",
    [rows[0].user_id, refreshToken, expiresAt],
  );

  return { accessToken, refreshToken };
};

export const logout = async (token, extra = {}) => {
  // Cari user_id sebelum token dihapus agar bisa dicatat
  const { rows } = await pool.query(
    'SELECT user_id FROM auth.refresh_tokens WHERE token = $1',
    [token],
  );
  await pool.query('DELETE FROM auth.refresh_tokens WHERE token = $1', [token]);
  if (rows[0]?.user_id) {
    logActivity(rows[0].user_id, 'LOGOUT', extra);
  }
};
