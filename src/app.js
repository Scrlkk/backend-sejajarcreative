import "./config/env.js";

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

import authRouter from "./modules/auth/auth.routes.js";
import usersRouter from "./modules/users/users.routes.js";
import clientsRouter from "./modules/clients/clients.routes.js";
import projectsRouter from "./modules/projects/projects.routes.js";
import tasksRouter from "./modules/tasks/tasks.routes.js";
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
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
        connectSrc: ["'self'"],
      },
    },
  }),
);
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Sejajar API Docs",
    customCss: `
    .swagger-ui .topbar { background-color: #1a1a2e; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after {
      content: 'Documentation';
      color: white;
      font-size: 1.2rem;
      font-weight: bold;
    }
  `,
    swaggerOptions: {
      persistAuthorization: true, // token tidak hilang saat refresh halaman
      displayRequestDuration: true, // tampilkan durasi request
      filter: true, // aktifkan search/filter endpoint
      tryItOutEnabled: true, // langsung bisa dicoba
    },
  }),
);

app.get("/api/docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/health", (req, res) =>
  res.json({
    status: "ok",
    service: "express-sejajar",
    timestamp: new Date().toISOString(),
  }),
);

const API = "/api";
app.use(`${API}/auth`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/clients`, clientsRouter);
app.use(`${API}/projects`, projectsRouter);
app.use(`${API}/tasks`, tasksRouter);
app.use(`${API}/contents`, contentsRouter);
app.use(`${API}/reviews`, reviewsRouter);
app.use(`${API}/analytics`, analyticsRouter);
app.use(`${API}/portfolio`, portfolioRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
