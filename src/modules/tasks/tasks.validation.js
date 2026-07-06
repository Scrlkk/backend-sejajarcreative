import { body } from "express-validator";
import { TASK_STATUS } from "#config/constants.js";

export const createRules = [
  body("content_id").isInt({ min: 1 }),
  body("assigned_to").isInt({ min: 1 }),
  body("title").notEmpty(),
  body("deadline").optional().isISO8601(),
];

export const updateRules = [
  body("status")
    .optional()
    .isIn(Object.values(TASK_STATUS)),
  body("deadline").optional().isISO8601(),
  body("assigned_to").optional().isInt({ min: 1 }),
];
