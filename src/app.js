import env from "./config/env.js";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import logger from "./config/logger.js";

import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";

import healthRouter from "./routes/health.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import usersRouter from "./modules/users/users.routes.js";
import clientsRouter from "./modules/clients/clients.routes.js";
import platformsRouter from "./modules/platforms/platforms.routes.js";
import contentTypesRouter from "./modules/content-types/content-types.routes.js";
import pillarsRouter from "./modules/pillars/pillars.routes.js";
import contractsRouter from "./modules/contracts/contracts.routes.js";
import tasksRouter from "./modules/tasks/tasks.routes.js";
import taskAssignmentsRouter from "./modules/task-assignments/task-assignments.routes.js";
import contentsRouter from "./modules/contents/contents.routes.js";
import reviewsRouter from "./modules/reviews/reviews.routes.js";
import analyticsRouter from "./modules/analytics/analytics.routes.js";
import portfolioRouter from "./modules/portfolio/portfolio.routes.js";

const app = express();

app.use(
  helmet({
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
        frameAncestors: ["'none'"],
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

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "info";
    logger[logLevel]({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      user_id: req.user?.id || "anonymous",
      ip: req.ip,
    });
  });
  next();
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

app.use("/api", apiLimiter);

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Sejajar API Docs",
    customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after {
      content: 'Sejajar API Documentation';
      color: white;
      font-size: 1.2rem;
      font-weight: bold;
    }
  `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  }),
);

app.use("/", healthRouter);

const API = "/api";
app.use(`${API}/auth`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/clients`, clientsRouter);
app.use(`${API}/platforms`, platformsRouter);
app.use(`${API}/content-types`, contentTypesRouter);
app.use(`${API}/pillars`, pillarsRouter);
app.use(`${API}/contracts`, contractsRouter);
app.use(`${API}/tasks`, tasksRouter);
app.use(`${API}/task-assignments`, taskAssignmentsRouter);
app.use(`${API}/contents`, contentsRouter);
app.use(`${API}/reviews`, reviewsRouter);
app.use(`${API}/analytics`, analyticsRouter);
app.use(`${API}/portfolio`, portfolioRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
