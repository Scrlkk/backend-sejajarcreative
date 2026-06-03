import logger from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  // PostgreSQL constraint errors
  if (err.code === "23505")
    return res.status(409).json({
      status: "error",
      message: "Data sudah ada (duplicate)",
      detail: err.detail || undefined,
    });
  if (err.code === "23503")
    return res
      .status(422)
      .json({ status: "error", message: "Referensi data tidak ditemukan (foreign key)" });
  if (err.code === "23514")
    return res
      .status(422)
      .json({ status: "error", message: "Constraint database dilanggar (check constraint)" });
  if (err.code === "23502")
    return res
      .status(422)
      .json({ status: "error", message: `Field wajib tidak boleh kosong: ${err.column || ""}` });

  // Express 5: SyntaxError dari body parsing
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ status: "error", message: "Request body bukan JSON valid" });

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

  res.status(statusCode).json({ status: "error", message });
};

export default errorHandler;

