import { body, query } from "express-validator";

export const recordRules = [
  body("content_id").isInt({ min: 1 }),
  body("likes").optional().isInt({ min: 0 }),
  body("views").optional().isInt({ min: 0 }),
];

export const topContentsRules = [
  query("contract_id").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
];
