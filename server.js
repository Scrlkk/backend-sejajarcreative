import "dotenv/config";
import app from "./src/app.js";
import env from "./src/config/env.js";
import { startAllJobs } from "./src/jobs/index.js";

const server = app.listen(env.port, () => {
  console.log("");
  console.log("  🚀 express-sejajar berjalan");
  console.log(`     URL         : http://localhost:${env.port}`);
  console.log(`     Environment : ${env.nodeEnv}`);
  console.log(
    `     Database    : ${env.db.name} @ ${env.db.host}:${env.db.port}`,
  );
  console.log("");

  startAllJobs();
});

process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM diterima. Menutup server...");
  server.close(() => {
    console.log("[Server] Server ditutup.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[Server] SIGINT diterima. Menutup server...");
  server.close(() => process.exit(0));
});
