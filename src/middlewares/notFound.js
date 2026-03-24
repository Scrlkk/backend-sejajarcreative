const AppError = require("../utils/AppError");

module.exports = (req, res, next) =>
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
