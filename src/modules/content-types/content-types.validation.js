import { body } from "express-validator";

export const createRules = [
  body("type_name").notEmpty().withMessage("Nama kategori wajib diisi"),
];

export const updateRules = [body("type_name").optional().notEmpty()];
