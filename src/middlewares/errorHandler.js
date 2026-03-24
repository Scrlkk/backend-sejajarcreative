const errorHandler = (err, req, res, next) => {
  if (err.code === "23505")
    return res
      .status(409)
      .json({ status: "error", message: "Data sudah ada (duplicate)" });
  if (err.code === "23503")
    return res
      .status(422)
      .json({ status: "error", message: "Referensi data tidak ditemukan" });
  if (err.code === "23514")
    return res
      .status(422)
      .json({ status: "error", message: "Constraint database dilanggar" });

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message;

  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.message}`);
  res.status(statusCode).json({ status: "error", message });
};

export default errorHandler;
