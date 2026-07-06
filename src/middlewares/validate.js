import { validationResult } from "express-validator";
import { error as errorResponse } from "#utils/response.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return errorResponse(res, "Validation failed", 422, errorDetails);
  }
  next();
};

export default validate;
