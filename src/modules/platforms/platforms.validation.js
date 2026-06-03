import { body } from "express-validator";

export const createRules = [
  body("platform_name")
    .notEmpty()
    .withMessage("platform_name wajib diisi")
    .isLength({ max: 100 })
    .withMessage("platform_name maksimal 100 karakter"),
];

export const updateRules = [
  body("platform_name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("platform_name maksimal 100 karakter"),
];
