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

const SEEDS_DIR = path.join(__dirname, "seeds");

const run = async () => {
  const client = await pool.connect();

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🌱 express-sejajar — Database Seeding");
  console.log(`      Host     : ${env.db.host}:${env.db.port}`);
  console.log(`      Database : ${env.db.name}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.seeds (
        id         SERIAL PRIMARY KEY,
        filename   VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT now()
      )
    `);

    const files = fs
      .readdirSync(SEEDS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const { rows } = await client.query(
      "SELECT filename FROM public.seeds ORDER BY filename",
    );
    const applied = new Set(rows.map((r) => r.filename));

    let count = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  ⏭  Skip  : ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(SEEDS_DIR, file), "utf8");
      console.log(`  🔄 Run   : ${file}`);

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO public.seeds (filename) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log(`  ✅ Done  : ${file}`);
        count++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  ❌ Error : ${file}`);
        console.error(`           ${err.message}`);
        throw err;
      }
    }

    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    if (count === 0) {
      console.log("  ✨ Seeds sudah up-to-date, tidak ada yang dijalankan.");
    } else {
      console.log(`  🎉 Selesai! ${count} seed file berhasil dijalankan.`);
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
  } catch (err) {
    console.error("");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("  💥 Seeding gagal, proses dihentikan.");
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
