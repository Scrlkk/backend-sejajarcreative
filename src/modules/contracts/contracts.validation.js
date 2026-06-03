import { body } from "express-validator";

export const createRules = [
  body("client_id").isInt({ min: 1 }).withMessage("client_id tidak valid"),
  body("contract_name").notEmpty().withMessage("Nama kontrak wajib diisi"),
  body("start_date").optional().isDate().withMessage("Format start_date harus YYYY-MM-DD"),
  body("end_date").optional().isDate().withMessage("Format end_date harus YYYY-MM-DD"),
];

export const updateRules = [
  body("status")
    .optional()
    .isIn(["planning", "ongoing", "review", "completed", "cancelled"])
    .withMessage("Status tidak valid"),
  body("start_date").optional().isDate(),
  body("end_date").optional().isDate(),
];
