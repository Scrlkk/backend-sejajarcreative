import env from "./config/env.js";

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerSpec, { swaggerUiOptions } from "#config/swagger.js";
import logger from "./config/logger.js";

import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import activityLogger from "./middlewares/activityLogger.js";

import healthRouter from "./routes/health.routes.js";
import apiRouter from "./routes/api.routes.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "validator.swagger.io"],
        connectSrc: [
          "'self'",
          "http://localhost:*",
          "https://validator.swagger.io",
        ],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

app.use(
  cors({
    origin: env.cors.origins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(swaggerSpec);
});

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(apiLimiter);

// Serve uploaded files statically
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(UPLOAD_DIR));
app.use("/api/uploads", express.static(UPLOAD_DIR));

// Endpoint to stream media without showing extension in URL, preventing IDM interception
const handleStreamMedia = (req, res) => {
  try {
    const basename = req.params.basename;
    const files = fs.readdirSync(UPLOAD_DIR);
    const matchedFile = files.find((file) => {
      const extIndex = file.lastIndexOf(".");
      const name = extIndex !== -1 ? file.substring(0, extIndex) : file;
      return name === basename;
    });

    if (!matchedFile) {
      return res.status(404).send("File not found");
    }

    const filePath = path.resolve(UPLOAD_DIR, matchedFile);
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error streaming media file:", error);
    res.status(500).send("Error streaming media file");
  }
};

app.get("/stream-media/:basename", handleStreamMedia);
app.get("/api/stream-media/:basename", handleStreamMedia);

// Auto-log all authenticated API requests to audit.activity_logs
app.use(activityLogger);

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions),
);

app.use("/", healthRouter);

app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
