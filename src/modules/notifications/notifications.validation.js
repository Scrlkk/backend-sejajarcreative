import { query, param } from "express-validator";

export const getAllRules = [
  query("is_read").optional().isIn(["true", "false"]),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("offset").optional().isInt({ min: 0 }),
];

export const idRule = [
  param("id").isInt({ min: 1 }).withMessage("ID notifikasi tidak valid"),
];
