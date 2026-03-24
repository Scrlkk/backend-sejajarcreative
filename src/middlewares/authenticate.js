import { verifyAccess } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return next(new AppError("Access token required", 401));

  try {
    req.user = verifyAccess(header.split(" ")[1]);
    next();
  } catch (err) {
    next(
      new AppError(
        err.name === "TokenExpiredError"
          ? "Access token expired"
          : "Invalid access token",
        401,
      ),
    );
  }
};

export default authenticate;