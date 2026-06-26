import { body } from "express-validator";

export const createRules = [
  body("pillar_name").notEmpty().isLength({ max: 100 }),
  body("description").optional().isLength({ max: 1000 }),
  body("color_key").optional().isLength({ max: 20 }),
];

export const updateRules = [
  body("pillar_name").optional().isLength({ max: 100 }),
  body("description").optional().isLength({ max: 1000 }),
  body("color_key").optional().isLength({ max: 20 }),
];
