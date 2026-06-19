import { query } from "express-validator";

const VALID_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PUBLISH",
  "LOGIN",
  "LOGOUT",
];

export const getAllRules = [
  query("user_id").optional().isInt({ min: 1 }),
  query("action")
    .optional()
    .isIn(VALID_ACTIONS)
    .withMessage(`Action harus salah satu dari: ${VALID_ACTIONS.join(", ")}`),
  query("table_name").optional().isString(),
  query("record_id").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
];
