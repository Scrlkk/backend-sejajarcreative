import jwt from "jsonwebtoken";
import crypto from "crypto";
import env from "#config/env.js";
import AppError from "./AppError.js";

/**
 * Sign access token dengan JTI (JWT ID) untuk tracking
 * @param {object} payload - User data
 * @returns {string} - Signed JWT token
 */
export const signAccess = (payload) => {
  const jti = crypto.randomUUID();
  return jwt.sign(
    {
      ...payload,
      jti,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn || "15m",
      algorithm: "HS256",
    },
  );
};

/**
 * Sign refresh token
 * @param {object} payload
 * @returns {string}
 */
export const signRefresh = (payload) => {
  const jti = crypto.randomUUID();
  return jwt.sign(
    {
      ...payload,
      jti,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
    },
    env.jwt.refreshSecret,
    {
      expiresIn: env.jwt.refreshExpiresIn || "7d",
      algorithm: "HS256",
    },
  );
};

/**
 * Verify access token dengan validasi ketat
 * @param {string} token
 * @returns {object}
 */
export const verifyAccess = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwt.secret, {
      algorithms: ["HS256"],
    });

    if (decoded.type !== "access") {
      throw new AppError("Invalid token type", 401);
    }

    return decoded;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Access token expired", 401);
    }
    if (err.name === "JsonWebTokenError") {
      throw new AppError("Invalid access token", 401);
    }
    throw err;
  }
};

/**
 * Verify refresh token
 * @param {string} token
 * @returns {object}
 */
export const verifyRefresh = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret, {
      algorithms: ["HS256"],
    });

    if (decoded.type !== "refresh") {
      throw new AppError("Invalid token type", 401);
    }

    return decoded;
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Refresh token expired", 401);
    }
    if (err.name === "JsonWebTokenError") {
      throw new AppError("Invalid refresh token", 401);
    }
    throw err;
  }
};
