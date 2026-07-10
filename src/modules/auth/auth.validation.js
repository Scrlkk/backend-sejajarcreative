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



export const refreshRules = [
  body("refresh_token")
    .isLength({ min: 10 })
    .withMessage("Refresh token tidak valid"),
];
