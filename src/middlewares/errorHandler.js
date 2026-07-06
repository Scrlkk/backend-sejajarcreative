import logger from "#config/logger.js";
import { error as errorResponse } from "#utils/response.js";

const errorHandler = (err, req, res, next) => {
  // PostgreSQL constraint errors
  if (err.code === "23505") {
    return errorResponse(res, "Data sudah ada (duplicate)", 409, err.detail || undefined);
  }
  if (err.code === "23503") {
    return errorResponse(res, "Referensi data tidak ditemukan (foreign key)", 422);
  }
  if (err.code === "23514") {
    return errorResponse(res, "Constraint database dilanggar (check constraint)", 422);
  }
  if (err.code === "23502") {
    return errorResponse(res, `Field wajib tidak boleh kosong: ${err.column || ""}`, 422);
  }

  // Express 5: SyntaxError dari body parsing
  if (err.type === "entity.parse.failed") {
    return errorResponse(res, "Request body bukan JSON valid", 400);
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message;

  logger.error({
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack,
    user_id: req.user?.id || "anonymous",
  });

  return errorResponse(res, message, statusCode);
};

export default errorHandler;

