import { body } from "express-validator";

export const createRules = [
  body("client_id").isInt({ min: 1 }).withMessage("client_id tidak valid"),
  body("contract_code").notEmpty().withMessage("Kode kontrak wajib diisi"),
  body("contract_name").notEmpty().withMessage("Nama kontrak wajib diisi"),
  body("lead_by").isInt({ min: 1 }).withMessage("lead_by tidak valid"),
  body("revenue").optional().isDecimal(),
  body("start_date").optional().isDate(),
  body("end_date").optional().isDate(),
  body("platform_ids").optional().isArray(),
  body("platform_ids.*").optional().isInt({ min: 1 }),
  body("team_user_ids").optional().isArray(),
  body("team_user_ids.*").optional().isInt({ min: 1 }),
];

export const updateRules = [
  body("status")
    .optional()
    .isIn(["active", "completed", "cancelled", "overdue"]),
  body("revenue").optional().isDecimal(),
  body("start_date").optional().isDate(),
  body("end_date").optional().isDate(),
  body("platform_ids").optional().isArray(),
  body("platform_ids.*").optional().isInt({ min: 1 }),
  body("team_user_ids").optional().isArray(),
  body("team_user_ids.*").optional().isInt({ min: 1 }),
];
