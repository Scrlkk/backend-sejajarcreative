import { body } from "express-validator";
import { ALLOWED_EXTS, MAX_FILE_SIZE } from "#config/upload.js";

export const createRules = [
  body("task_id").isInt({ min: 1 }).withMessage("task_id wajib diisi"),
  body("caption").optional().isString(),
  body("hashtag").optional().isString(),
  body("file_url").optional().isString(),
];

export const fileUploadRules = {
  allowedExts: ALLOWED_EXTS,
  maxSize: MAX_FILE_SIZE,
};
