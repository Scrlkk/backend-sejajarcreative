import { body } from "express-validator";

export const createRules = [
  body("type_name")
    .notEmpty()
    .withMessage("type_name wajib diisi")
    .isLength({ max: 100 })
    .withMessage("type_name maksimal 100 karakter"),
];

export const updateRules = [
  body("type_name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("type_name maksimal 100 karakter"),
];
