import { body } from "express-validator";

export const createRules = [
  body("type_name").notEmpty().withMessage("Nama kategori wajib diisi"),
  body("color_key").optional({ nullable: true }).isLength({ max: 20 }),
];

export const updateRules = [
  body("type_name").optional().notEmpty(),
  body("is_active").optional().isBoolean(),
  body("color_key").optional({ nullable: true }).isLength({ max: 20 }),
];

