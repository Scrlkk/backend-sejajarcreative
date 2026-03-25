import { body } from "express-validator";

export const loginRules = [
  body("email").isEmail().withMessage("Email tidak valid"),
  body("password").notEmpty().withMessage("Password wajib diisi"),
];

export const refreshRules = [
  body("refresh_token").notEmpty().withMessage("Refresh token wajib diisi"),
];
