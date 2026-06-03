import { body } from "express-validator";

export const createRules = [
  body("contract_id").isInt({ min: 1 }),
  body("content_type_id").isInt({ min: 1 }),
  body("title").notEmpty(),
  body("platform_ids").optional().isArray(),
  body("platform_ids.*").optional().isInt({ min: 1 }),
];

export const updateRules = [
  body("status")
    .optional()
    .isIn(["draft", "in_review", "approved", "published"]),
  body("platform_ids").optional().isArray(),
];
