import "dotenv/config";
import app from "./src/app.js";
import env from "./src/config/env.js";
import { closePool } from "./src/config/database.js";

const server = app.listen(env.port, () => {
  console.log("");
  console.log("     express-sejajar running");
  console.log(`     URL         : http://localhost:${env.port}`);
  console.log(`     Environment : ${env.nodeEnv}`);
  console.log(
    `     Database    : ${env.db.name} @ ${env.db.host}:${env.db.port}`,
  );
  console.log("");
});

const gracefulShutdown = async (signal) => {
  console.log(`[Server] ${signal} diterima. Menutup server...`);
  server.close(async () => {
    console.log("[Server] Server HTTP ditutup.");
    await closePool();
    console.log("[Server] Database pool ditutup. Keluar.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Tangkap promise rejection yang tidak ditangkap
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});

// Tangkap exception synchronous yang tidak ditangkap
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught Exception:", err.message, err.stack);
  // Jangan langsung exit — biarkan graceful shutdown menangani
  gracefulShutdown("uncaughtException");
});

