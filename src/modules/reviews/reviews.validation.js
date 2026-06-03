import { body, param } from "express-validator";

export const createRules = [
  param("assignmentId")
    .isInt({ min: 1 })
    .withMessage("assignmentId di URL tidak valid"),
  body("feedback").notEmpty().withMessage("Feedback wajib diisi"),
  body("status")
    .isIn(["revision", "approved"])
    .withMessage("Status review harus: revision atau approved"),
];
