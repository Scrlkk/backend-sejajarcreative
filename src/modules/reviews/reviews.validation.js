import { body, param } from "express-validator";

export const createRules = [
  param("contentId")
    .isInt({ min: 1 })
    .withMessage("contentId di URL tidak valid"),
  body("feedback").notEmpty().withMessage("Feedback wajib diisi"),
  body("status")
    .isIn(["revision", "approved"])
    .withMessage("Status review harus: revision atau approved"),
];
