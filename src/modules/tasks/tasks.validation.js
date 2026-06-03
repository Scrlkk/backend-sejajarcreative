import { body } from "express-validator";

export const createRules = [
  body("content_id").isInt({ min: 1 }),
  body("pillar_id").isInt({ min: 1 }),
  body("title").notEmpty(),
  body("start_date").optional().isDate(),
  body("due_date").optional().isDate(),
];

export const updateRules = [
  body("status")
    .optional()
    .isIn(["pending", "in_progress", "review", "done"]),
  body("start_date").optional().isDate(),
  body("due_date").optional().isDate(),
  body("pillar_id").optional().isInt({ min: 1 }),
];
