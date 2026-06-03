import { body } from "express-validator";

/**
 * Login validation rules
 * - Email: standard email format
 * - Password: 8-128 chars (length check, regex di backend)
 */
export const loginRules = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .isLength({ min: 5, max: 255 })
    .withMessage("Email tidak valid (5-255 karakter)"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .withMessage("Password harus 8-128 karakter"),
];

/**
 * Register/Create User validation rules
 * - Full name: 3-100 chars, no special chars
 * - Email: standard format
 * - Password: strong requirements
 *   - Min 8 chars
 *   - At least 1 uppercase
 *   - At least 1 lowercase
 *   - At least 1 number
 *   - At least 1 special char (@$!%*?&)
 */
export const registerRules = [
  body("full_name")
    .trim()
    .isLength({ min: 3, max: 100 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Nama harus 3-100 karakter, tanpa karakter spesial"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email tidak valid"),
  body("password")
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]/)
    .withMessage(
      "Password minimal 8 karakter dengan huruf besar, huruf kecil, angka, dan simbol (@$!%*?&)",
    ),
  body("role")
    .isIn([
      "superadmin",
      "owner",
      "content_lead",
      "content_editor",
      "script_writer",
      "admin_social_media",
    ])
    .withMessage("Role tidak valid"),
];

export const refreshRules = [
  body("refresh_token")
    .isLength({ min: 10 })
    .withMessage("Refresh token tidak valid"),
];
