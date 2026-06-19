import { body } from "express-validator";

export const createRules = [
  body("content_id").isInt({ min: 1 }).withMessage("content_id tidak valid"),
  body("feedback").notEmpty().withMessage("Feedback wajib diisi"),
];
