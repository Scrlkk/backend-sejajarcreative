import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const signAccess = (payload) =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
export const signRefresh = (payload) =>
  jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
export const verifyAccess = (token) => jwt.verify(token, env.jwt.secret);
export const verifyRefresh = (token) =>
  jwt.verify(token, env.jwt.refreshSecret);
