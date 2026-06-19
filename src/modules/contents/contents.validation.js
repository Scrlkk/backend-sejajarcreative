import { body } from "express-validator";

export const createRules = [
  body("contract_id").isInt({ min: 1 }),
  body("platform_id").isInt({ min: 1 }),
  body("content_category_id").isInt({ min: 1 }),
  body("pillar_id").isInt({ min: 1 }),
  body("title").notEmpty(),
  body("priority").optional().isIn(["low", "medium", "high"]),
];

export const updateRules = [
  body("status")
    .optional()
    .isIn([
      "draft",
      "assigned",
      "on_progress",
      "review",
      "revision",
      "approved",
      "published",
      "overdue",
    ]),
  body("priority").optional().isIn(["low", "medium", "high"]),
];
