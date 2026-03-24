const AppError = require("../utils/AppError");

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return next(new AppError("Forbidden: insufficient permissions", 403));
    next();
  };

module.exports = authorize;
