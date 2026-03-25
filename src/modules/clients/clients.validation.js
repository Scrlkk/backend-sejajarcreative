import { body } from "express-validator";

export const createRules = [
  body("client_name").notEmpty().withMessage("Nama client wajib diisi"),
  body("contact_email")
    .optional()
    .isEmail()
    .withMessage("Format email tidak valid"),
];

export const updateRules = [
  body("contact_email")
    .optional()
    .isEmail()
    .withMessage("Format email tidak valid"),
];