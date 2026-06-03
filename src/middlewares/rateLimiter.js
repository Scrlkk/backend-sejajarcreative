import rateLimit from "express-rate-limit";

/**
 * Rate limiter untuk endpoint login
 * Max 5 attempts dalam 15 menit
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter untuk endpoint refresh token
 * Max 20 attempts dalam 1 jam
 */
export const refreshLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: "Terlalu banyak percobaan refresh. Coba lagi nanti.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Global API rate limiter
 * Max 100 requests per 15 menit per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === "/health" || req.originalUrl.startsWith("/api/docs");
  },
});
