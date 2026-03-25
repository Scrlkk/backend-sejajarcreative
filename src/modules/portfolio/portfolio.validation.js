import { body } from "express-validator";

export const createRules = [
  body("content_id").isInt({ min: 1 }).withMessage("content_id tidak valid"),
  body("is_featured")
    .optional()
    .isBoolean()
    .withMessage("is_featured harus true atau false"),
  body("display_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("display_order harus berupa angka >= 0"),
];

export const updateRules = [
  body("is_featured")
    .optional()
    .isBoolean()
    .withMessage("is_featured harus true atau false"),
  body("display_order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("display_order harus berupa angka >= 0"),
];
