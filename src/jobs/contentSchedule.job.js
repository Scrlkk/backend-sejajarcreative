import cron from "node-cron";
import pool from "../config/database.js";
import env from "../config/env.js";

const runScheduleChecker = async () => {
  console.log(
    `[Cronjob] ${new Date().toISOString()} — Mengecek jadwal konten...`,
  );
  try {
    const { rows } = await pool.query(
      `SELECT id, title FROM core.contents
       WHERE status = 'approved'
         AND publish_date IS NOT NULL
         AND publish_date <= now()
         AND published_at IS NULL`,
    );

    if (rows.length === 0) {
      console.log("[Cronjob] Tidak ada konten yang perlu dipublish.");
      return;
    }

    console.log(`[Cronjob] Ditemukan ${rows.length} konten siap dipublish.`);

    const results = await Promise.allSettled(
      rows.map((c) =>
        pool.query(
          `UPDATE core.contents SET status = 'published', published_at = now() WHERE id = $1`,
          [c.id],
        ),
      ),
    );

    results.forEach((result, i) => {
      if (result.status === "fulfilled")
        console.log(
          `[Cronjob] ✓ Konten #${rows[i].id} "${rows[i].title}" dipublish.`,
        );
      else
        console.error(
          `[Cronjob] ✗ Gagal publish konten #${rows[i].id}:`,
          result.reason?.message,
        );
    });
  } catch (err) {
    console.error("[Cronjob] Error saat pengecekan:", err.message);
  }
};

export const start = () => {
  const { contentSchedule, timezone } = env.cron;

  if (!cron.validate(contentSchedule)) {
    console.error(
      `[Cronjob] Ekspresi tidak valid: "${contentSchedule}". Job tidak dijalankan.`,
    );
    return;
  }

  cron.schedule(contentSchedule, runScheduleChecker, {
    scheduled: true,
    timezone,
  });

  console.log(`[Cronjob] Content schedule checker aktif`);
  console.log(`          Jadwal   : ${contentSchedule}`);
  console.log(`          Timezone : ${timezone}`);
};

export { runScheduleChecker };
