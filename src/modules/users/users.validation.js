import { body } from "express-validator";

const validRoles = [
  "superadmin",
  "owner",
  "content_lead",
  "content_editor",
  "script_writer",
  "admin_social_media",
];

export const createRules = [
  body("full_name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Nama lengkap minimal 3 karakter"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email tidak valid"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/)
    .withMessage("Password minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol (@$!%*?&)"),
  body("role")
    .notEmpty().withMessage("Role wajib diisi")
    .isIn(validRoles).withMessage(`Role harus salah satu dari: ${validRoles.join(", ")}`),
];

export const updateRules = [
  body("email").optional().isEmail().normalizeEmail().withMessage("Email tidak valid"),
  body("password")
    .optional()
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/)
    .withMessage("Password minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol (@$!%*?&)"),
  body("role").optional().isIn(validRoles).withMessage(`Role harus salah satu dari: ${validRoles.join(", ")}`),
];

