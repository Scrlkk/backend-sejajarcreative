import { body } from "express-validator";

export const createRules = [
  body("client_id").isInt({ min: 1 }).withMessage("client_id tidak valid"),
  body("project_name").notEmpty().withMessage("Nama project wajib diisi"),
  body("start_date")
    .optional()
    .isDate()
    .withMessage("Format start_date harus YYYY-MM-DD"),
  body("end_date")
    .optional()
    .isDate()
    .withMessage("Format end_date harus YYYY-MM-DD"),
];

export const updateRules = [
  body("status")
    .optional()
    .isIn(["planning", "ongoing", "review", "completed", "cancelled"])
    .withMessage("Status tidak valid"),
  body("start_date")
    .optional()
    .isDate()
    .withMessage("Format start_date harus YYYY-MM-DD"),
  body("end_date")
    .optional()
    .isDate()
    .withMessage("Format end_date harus YYYY-MM-DD"),
];

export const memberRules = [
  body("user_id").isInt({ min: 1 }).withMessage("user_id tidak valid"),
  body("role_in_project").optional().isString(),
];
