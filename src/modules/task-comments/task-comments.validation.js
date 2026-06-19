import { body } from "express-validator";

export const createRules = [
  body("task_id").isInt({ min: 1 }),
  body("message").notEmpty().withMessage("Message wajib diisi"),
];
