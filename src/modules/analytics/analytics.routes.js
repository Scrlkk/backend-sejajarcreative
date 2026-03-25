import { Router } from "express";
import * as controller from "./analytics.controller.js";
import { recordRules, topQueryRules } from "./analytics.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.use(authenticate);

// GET /api/analytics/top
router.get("/top", topQueryRules, validate, controller.getTopContents);

// GET /api/analytics/content/:contentId
router.get("/content/:contentId", controller.getByContent);

// GET /api/analytics/content/:contentId/summary
router.get("/content/:contentId/summary", controller.getSummary);

// POST /api/analytics/engagements
router.post(
  "/engagements",
  authorize("superadmin", "owner", "admin_social_media"),
  recordRules,
  validate,
  controller.record,
);

export default router;
