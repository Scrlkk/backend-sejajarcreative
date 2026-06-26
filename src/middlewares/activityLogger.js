import pool from "../config/database.js";
import logger from "../config/logger.js";

// Map HTTP method → activity action
const METHOD_ACTION = {
  GET: "READ",
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE",
};

// Routes that should NOT be logged (too noisy, or auth endpoints)
const SKIP_PATHS = ["/api/docs", "/api/docs.json", "/health", "/api/dashboard"];

const SKIP_METHODS_ON_PATH = {
  GET: ["/api/activity-logs"], // reading logs shouldn't create new log entries
};

/**
 * Extract resource name from URL path.
 * "/api/contents/5" → "core.contents"
 * "/api/tasks/3" → "core.tasks"
 */
const extractTableName = (path) => {
  const parts = path.replace(/^\//, "").split("/");
  // parts[0] = "api", parts[1] = resource name
  if (parts[0] === "api" && parts[1]) {
    const resource = parts[1];
    // Map URL resource to schema.table (best-effort)
    const mapping = {
      users: "core.users",
      clients: "core.clients",
      platforms: "core.platforms",
      "content-categories": "core.content_category",
      pillars: "core.pillars",
      contracts: "core.contracts",
      contents: "core.contents",
      tasks: "core.tasks",
      "task-outputs": "core.task_outputs",
      "task-comments": "core.task_comments",
      reviews: "core.content_reviews",
      analytics: "analytics.engagements",
      portfolio: "public.portfolio_items",
      "activity-logs": "audit.activity_logs",
      notifications: "notification.notifications",
      auth: "core.users",
    };
    return mapping[resource] || `api.${resource}`;
  }
  return null;
};

/**
 * Extract record ID from URL.
 * "/api/contents/5" → 5, "/api/tasks" → null
 */
const extractRecordId = (path) => {
  const parts = path.replace(/^\//, "").split("/");
  // Look for numeric ID in path
  for (let i = parts.length - 1; i >= 0; i--) {
    const num = parseInt(parts[i], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
};

const activityLogger = (req, res, next) => {
  // Intercept res.json() to log activity BEFORE the response is sent
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Only log successful, authenticated API requests
    if (
      !req.originalUrl?.startsWith("/api") ||
      SKIP_PATHS.some((p) => req.originalUrl.startsWith(p)) ||
      SKIP_METHODS_ON_PATH[req.method]?.some((p) =>
        req.originalUrl.startsWith(p),
      ) ||
      res.statusCode < 200 ||
      res.statusCode >= 300 ||
      !req.user?.id
    ) {
      return originalJson(body);
    }

    const action = METHOD_ACTION[req.method] || req.method;
    const tableName = extractTableName(req.originalUrl);
    const recordId = extractRecordId(req.originalUrl);

    // Filter out noisy logs: only log CREATE, UPDATE, and DELETE actions on core system tables
    const ALLOWED_TABLES = [
      "core.users",
      "core.contracts",
      "core.clients",
      "core.tasks",
    ];
    const ALLOWED_ACTIONS = ["CREATE", "UPDATE", "DELETE"];

    if (!ALLOWED_TABLES.includes(tableName) || !ALLOWED_ACTIONS.includes(action)) {
      return originalJson(body);
    }

    // Fetch entity name and insert log asynchronously
    const logActivity = async () => {
      let entityName = null;
      if (recordId) {
        const tableQueries = {
          "core.users": { table: "core.users", field: "full_name" },
          "core.contracts": { table: "core.contracts", field: "contract_name" },
          "core.clients": { table: "core.clients", field: "client_name" },
          "core.tasks": { table: "core.tasks", field: "title" }
        };
        const config = tableQueries[tableName];
        if (config) {
          try {
            const { rows } = await pool.query(
              `SELECT ${config.field} AS name FROM ${config.table} WHERE id = $1`,
              [recordId]
            );
            entityName = rows[0]?.name || null;
          } catch (err) {
            logger.error(`[ActivityLogger] Failed to fetch entity name for ${tableName}:${recordId}`, err);
          }
        }
      }

      let parsedNewValues = null;
      if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
        const safeBody = { ...req.body };
        delete safeBody.password;
        delete safeBody.refresh_token;
        if (entityName) {
          const nameKey = tableName === "core.tasks" || tableName === "core.contracts" ? "title" : "name";
          safeBody[nameKey] = entityName;
        }
        if (Object.keys(safeBody).length > 0) {
          parsedNewValues = JSON.stringify(safeBody);
        }
      } else if (action === "DELETE" && entityName) {
        const nameKey = tableName === "core.tasks" || tableName === "core.contracts" ? "title" : "name";
        parsedNewValues = JSON.stringify({ [nameKey]: entityName });
      }

      await pool.query(
        `INSERT INTO audit.activity_logs
         (user_id, action, table_name, record_id, new_values, ip_address, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [
          req.user.id,
          action,
          tableName,
          recordId,
          parsedNewValues,
          req.ip,
          req.get("user-agent") || null,
        ]
      );
    };

    logActivity().catch((err) => {
      logger.error("[ActivityLogger] Failed to insert activity log", {
        error: err.message,
        code: err.code,
        path: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
      });
    });

    // Always call the original json method
    return originalJson(body);
  };

  next();
};

export default activityLogger;
