import { body } from "express-validator";

export const createRules = [
  body("project_id").isInt({ min: 1 }).withMessage("project_id tidak valid"),
  body("title").notEmpty().withMessage("Judul konten wajib diisi"),
  body("task_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("task_id harus berupa ID valid"),
  body("content_pillar_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("content_pillar_id harus berupa ID valid"),
  body("file_url")
    .optional()
    .isURL()
    .withMessage("file_url harus berupa URL valid"),
  body("publish_date")
    .optional()
    .isISO8601()
    .withMessage("Format publish_date tidak valid"),
];

export const updateRules = [
  body("title")
    .optional()
    .notEmpty()
    .withMessage("Judul konten tidak boleh kosong"),
  body("status")
    .optional()
    .isIn(["draft", "in_review", "approved", "published"])
    .withMessage("Status harus: draft, in_review, approved, atau published"),
  body("file_url")
    .optional()
    .isURL()
    .withMessage("file_url harus berupa URL valid"),
  body("publish_date")
    .optional()
    .isISO8601()
    .withMessage("Format publish_date tidak valid"),
];
