import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import env from "#config/env.js";

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
      throw err;
    }
  }

  return count;
};

const run = async () => {
  const client = await pool.connect();

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🔥 express-sejajar — Migrate Fresh");
  console.log(`      Host     : ${env.db.host}:${env.db.port}`);
  console.log(`      Database : ${env.db.name}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("⚠️  WARNING: Ini akan menghapus SEMUA data & schema!");
  console.log("");

  try {
    console.log("🗑️  Dropping all objects...");

    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables
        FOR r IN (
          SELECT tablename, schemaname
          FROM pg_tables
          WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
          AND schemaname NOT LIKE 'pg_%'
        ) LOOP
          EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', r.schemaname, r.tablename);
        END LOOP;
      END $$;
    `);

    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT typname, nspname
          FROM pg_type
          JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
          WHERE nspname NOT IN ('pg_catalog', 'information_schema')
          AND typname NOT LIKE 'pg_%'
        ) LOOP
          EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', r.nspname, r.typname);
        END LOOP;
      END $$;
    `);

    await client.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT nspname
          FROM pg_namespace
          WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'public')
          AND nspname NOT LIKE 'pg_%'
        ) LOOP
          EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', r.nspname);
        END LOOP;
      END $$;
    `);

    console.log("  ✅ All objects dropped");
    console.log("");

    console.log("🔄 Resetting tracking tables...");
    await client.query("DROP TABLE IF EXISTS public.migrations");
    await client.query("DROP TABLE IF EXISTS public.seeds");
    console.log("  ✅ Tracking tables reset");
    console.log("");

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT now()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.seeds (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT now()
      )
    `);

    console.log("📦 Migrations:");
    const migrCount = await runSqlFiles(
      client,
      MIGRATIONS_DIR,
      "migrations",
      "migration",
    );

    console.log("");

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
    console.log(
      `  🎉 Fresh migration selesai! ${migrCount} migration berhasil.`,
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
  } catch (err) {
    console.error("");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  💥 Migrate fresh gagal, proses dihentikan.");
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
