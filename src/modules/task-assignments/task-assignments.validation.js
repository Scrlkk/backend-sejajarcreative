import { body } from "express-validator";

const assignmentRoles = ["scriptwriter", "content_editor", "social_media_admin"];
const taskStatuses = ["pending", "in_progress", "review", "done"];

export const createRules = [
  body("task_id").isInt({ min: 1 }),
  body("assigned_to").isInt({ min: 1 }),
  body("assignment_role").isIn(assignmentRoles),
  body("script_text").optional().isString(),
  body("file_url").optional().isString(),
  body("notes_from_admin").optional().isString(),
];

export const updateRules = [
  body("status").optional().isIn(taskStatuses),
  body("assignment_role").optional().isIn(assignmentRoles),
  body("assigned_to").optional().isInt({ min: 1 }),
];
