import pg from "pg";
import env from "./env.js";

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
  console.log("[DB] Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected error on idle client:", err);
  process.exit(-1);
});

export default pool;
