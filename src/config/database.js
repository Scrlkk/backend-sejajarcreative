import pg from "pg";
import env from "./env.js";
import logger from "./logger.js";

// Parse DATE (OID 1082) as raw string to avoid timezone offset shifts
pg.types.setTypeParser(1082, (val) => val);
// Parse TIMESTAMP (OID 1114) as raw string to avoid timezone offset shifts
pg.types.setTypeParser(1114, (val) => val);

const { Pool } = pg;

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("connect", () => {
  logger.info("[DB] Client connected to PostgreSQL");
});

pool.on("error", (err) => {
  logger.error("[DB] Unexpected error on idle client", {
    error: err.message,
    code: err.code,
  });
});

// Handle drain
pool.on("drain", () => {
  logger.warn("[DB] All clients in the pool are idle");
});

/**
 * Check database connectivity
 * @returns {Promise<boolean>}
 */
export const checkDBHealth = async () => {
  try {
    await pool.query("SELECT NOW()");
    return true;
  } catch (err) {
    logger.error("Database health check failed", { error: err.message });
    return false;
  }
};

/**
 * Graceful shutdown
 */
export const closePool = async () => {
  try {
    await pool.end();
    logger.info("Database pool closed gracefully");
  } catch (err) {
    logger.error("Error closing database pool", { error: err.message });
  }
};

export default pool;
