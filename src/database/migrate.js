import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "#config/env.js";

// Pengganti __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
});

const MIGRATIONS_DIR = path.join(__dirname, "migrations");
const SEEDS_DIR = path.join(__dirname, "seeds");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const runSqlFiles = async (client, dir, trackingTable, label) => {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows } = await client.query(
    `SELECT filename FROM public.${trackingTable} ORDER BY filename`,
  );
  const applied = new Set(rows.map((r) => r.filename));

  let count = 0;

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  ⏭  Skip     [${label}] : ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    console.log(`  🔄 Running  [${label}] : ${file}`);

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO public.${trackingTable} (filename) VALUES ($1)`,
        [file],
      );
      await client.query("COMMIT");
      console.log(`  ✅ Done     [${label}] : ${file}`);
      count++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`  ❌ Failed   [${label}] : ${file}`);
      console.error(`              Error   : ${err.message}`);
      throw err; // hentikan proses
    }
  }

  return count;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const run = async () => {
  const client = await pool.connect();

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🗄️  express-sejajar — Database Migration");
  console.log(`      Host     : ${env.db.host}:${env.db.port}`);
  console.log(`      Database : ${env.db.name}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  try {
    // Buat tabel tracking migrasi (harus ada sebelum migration pertama dijalankan)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT now()
      )
    `);

    // Buat tabel tracking seeds
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.seeds (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT now()
      )
    `);

    // ── Jalankan migrations ──────────────────────────────────────
    console.log("📦 Migrations:");
    const migrCount = await runSqlFiles(
      client,
      MIGRATIONS_DIR,
      "migrations",
      "migration",
    );

    console.log("");

    // ── Jalankan seeds (hanya jika bukan production) ─────────────
    if (env.nodeEnv !== "production") {
      console.log("🌱 Seeds:");
      const seedCount = await runSqlFiles(client, SEEDS_DIR, "seeds", "seed");
      console.log("");
      console.log(`  Seeds    : ${seedCount} file dijalankan`);
    } else {
      console.log("  ⚠️  Seeds  : dilewati (NODE_ENV=production)");
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (migrCount === 0) {
      console.log("  ✨ Database sudah up-to-date, tidak ada yang dijalankan.");
    } else {
      console.log(`  🎉 Selesai! ${migrCount} migration berhasil dijalankan.`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
  } catch (err) {
    console.error("");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  💥 Migration gagal, proses dihentikan.");
    console.error(`     ${err.message}`);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("");
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

run();
