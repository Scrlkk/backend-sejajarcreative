import { body } from "express-validator";

export const createRules = [
  body("contract_id").isInt({ min: 1 }),
  body("platform_id").isInt({ min: 1 }),
  body("content_category_id").isInt({ min: 1 }),
  body("pillar_ids").isArray({ min: 1 }).withMessage("At least one pillar is required"),
  body("pillar_ids.*").isInt({ min: 1 }).withMessage("Each pillar_id must be a positive integer"),
  body("title").notEmpty(),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("format").optional().isIn(["Video", "Image"]),
  body("team_user_ids").optional().isArray(),
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
      "scheduled",
      "published",
      "overdue",
    ]),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("format").optional().isIn(["Video", "Image"]),
  body("team_user_ids").optional().isArray(),
  body("pillar_ids").optional().isArray({ min: 1 }).withMessage("At least one pillar is required"),
  body("pillar_ids.*").optional().isInt({ min: 1 }),
];
