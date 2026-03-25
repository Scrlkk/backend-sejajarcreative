import { body } from "express-validator";

export const createRules = [
  body("project_id").isInt({ min: 1 }).withMessage("project_id tidak valid"),
  body("title").notEmpty().withMessage("Judul task wajib diisi"),
  body("assigned_to")
    .optional()
    .isInt({ min: 1 })
    .withMessage("assigned_to harus berupa ID user valid"),
  body("start_date")
    .optional()
    .isDate()
    .withMessage("Format start_date harus YYYY-MM-DD"),
  body("due_date")
    .optional()
    .isDate()
    .withMessage("Format due_date harus YYYY-MM-DD"),
];

export const updateRules = [
  body("title")
    .optional()
    .notEmpty()
    .withMessage("Judul task tidak boleh kosong"),
  body("status")
    .optional()
    .isIn(["pending", "in_progress", "review", "done"])
    .withMessage("Status harus: pending, in_progress, review, atau done"),
  body("assigned_to")
    .optional()
    .isInt({ min: 1 })
    .withMessage("assigned_to harus berupa ID user valid"),
  body("start_date")
    .optional()
    .isDate()
    .withMessage("Format start_date harus YYYY-MM-DD"),
  body("due_date")
    .optional()
    .isDate()
    .withMessage("Format due_date harus YYYY-MM-DD"),
];
