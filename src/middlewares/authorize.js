import AppError from "../utils/AppError.js";

const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return next(new AppError("Forbidden: insufficient permissions", 403));
    next();
  };

export default authorize;
