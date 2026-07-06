import AppError from "#utils/AppError.js";

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Forbidden: insufficient permissions", 403));
    }
    const userRoles = req.user.roles?.length
      ? req.user.roles
      : req.user.role
        ? [req.user.role]
        : [];
    const allowed = roles.some((r) => userRoles.includes(r));
    if (!allowed) {
      return next(new AppError("Forbidden: insufficient permissions", 403));
    }
    next();
  };

export default authorize;
