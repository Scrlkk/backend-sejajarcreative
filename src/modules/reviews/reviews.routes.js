import { Router } from "express";
import * as controller from "./reviews.controller.js";
import { createRules } from "./reviews.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.use(authenticate);

// GET  /api/reviews/content/:contentId
router.get("/content/:contentId", controller.getByContent);

// POST /api/reviews/content/:contentId
router.post(
  "/content/:contentId",
  authorize("superadmin", "owner", "content_lead"),
  createRules,
  validate,
  controller.create,
);

export default router;
