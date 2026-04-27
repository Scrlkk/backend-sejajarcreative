import pool from "../../config/database.js";
import { compare } from "../../utils/hash.js";
import { signAccess, signRefresh, verifyRefresh } from "../../utils/jwt.js";
import AppError from "../../utils/AppError.js";

export const login = async (email, password) => {
  const { rows } = await pool.query(
    "SELECT id, full_name, email, password, role, is_active FROM core.users WHERE email = $1",
    [email],
  );
  const user = rows[0];
  if (!user || !(await compare(password, user.password)))
    throw new AppError("Invalid credentials", 401);

  if (!user.is_active) throw new AppError("User account is inactive", 403);

  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await pool.query(
    "INSERT INTO auth.refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)",
    [user.id, refreshToken, expiresAt],
  );

  return {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
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
    `SELECT rt.*, u.id AS user_id, u.email, u.role, u.is_active
     FROM auth.refresh_tokens rt
     JOIN core.users u ON u.id = rt.user_id
     WHERE rt.token = $1 AND rt.expires_at > now()`,
    [token],
  );
  if (!rows[0]) throw new AppError("Refresh token not found", 401);

  if (!rows[0].is_active) throw new AppError("User account is inactive", 403);

  await pool.query("DELETE FROM auth.refresh_tokens WHERE token = $1", [token]);

  const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
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

export const logout = async (token) => {
  await pool.query("DELETE FROM auth.refresh_tokens WHERE token = $1", [token]);
};
