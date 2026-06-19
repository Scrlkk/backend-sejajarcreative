import { body } from "express-validator";

export const createRules = [
  body("content_id").isInt({ min: 1 }),
  body("assigned_to").isInt({ min: 1 }),
  body("title").notEmpty(),
  body("deadline").optional().isDate(),
];

export const updateRules = [
  body("status")
    .optional()
    .isIn([
      "to_do",
      "on_progress",
      "review",
      "revision",
      "approved",
      "scheduled",
      "published",
      "overdue",
    ]),
  body("deadline").optional().isDate(),
  body("assigned_to").optional().isInt({ min: 1 }),
];
