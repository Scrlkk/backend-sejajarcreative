import { body, query } from "express-validator";

export const recordRules = [
  body("content_id").isInt({ min: 1 }).withMessage("content_id tidak valid"),
  body("likes")
    .optional()
    .isInt({ min: 0 })
    .withMessage("likes harus berupa angka >= 0"),
  body("comments")
    .optional()
    .isInt({ min: 0 })
    .withMessage("comments harus berupa angka >= 0"),
  body("views")
    .optional()
    .isInt({ min: 0 })
    .withMessage("views harus berupa angka >= 0"),
  body("shares")
    .optional()
    .isInt({ min: 0 })
    .withMessage("shares harus berupa angka >= 0"),
];

export const topQueryRules = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit harus antara 1-50"),
  query("project_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("project_id tidak valid"),
];
