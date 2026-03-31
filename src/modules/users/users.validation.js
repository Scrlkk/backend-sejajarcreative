import { body } from "express-validator";

export const createRules = [
  body("full_name").notEmpty().withMessage("Nama lengkap wajib diisi"),
  body("email").isEmail().withMessage("Email tidak valid"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter"),
  body("role").notEmpty().withMessage("Role wajib diisi"),
];

export const updateRules = [
  body("email").optional().isEmail().withMessage("Email tidak valid"),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password minimal 8 karakter"),
];
