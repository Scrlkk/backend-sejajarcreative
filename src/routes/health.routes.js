import { Router } from "express";
import { checkDBHealth } from "#config/database.js";
import logger from "#config/logger.js";

const router = Router();

/**
 * Liveness probe - untuk check apakah service masih running
 */
router.get("/healthz", (req, res) => {
  res.json({
    status: "alive",
    service: "express-sejajar",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe - untuk check apakah service siap menerima requests
 * Includes database connectivity check
 */
router.get("/health", async (req, res) => {
  try {
    const dbHealthy = await checkDBHealth();

    if (!dbHealthy) {
      logger.warn("Health check failed: Database unhealthy");
      return res.status(503).json({
        status: "unhealthy",
        service: "express-sejajar",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: "healthy",
      service: "express-sejajar",
      database: "connected",
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Health check error", { error: err.message });
    res.status(503).json({
      status: "unhealthy",
      service: "express-sejajar",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Detailed status endpoint - untuk monitoring
 */
router.get("/status", async (req, res) => {
  try {
    const dbHealthy = await checkDBHealth();

    res.json({
      version: "1.0.0",
      service: "express-sejajar",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      database: {
        connected: dbHealthy,
        status: dbHealthy ? "connected" : "disconnected",
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: Math.round(
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100,
        ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Status check error", { error: err.message });
    res.status(500).json({
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
