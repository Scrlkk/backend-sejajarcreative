import { Router } from "express";
import * as controller from "./contents.controller.js";
import { createRules, updateRules } from "./contents.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post(
  "/",
  authorize(
    "superadmin",
    "owner",
    "content_lead",
    "content_editor",
    "script_writer",
  ),
  createRules,
  validate,
  controller.create,
);
router.put(
  "/:id",
  authorize(
    "superadmin",
    "owner",
    "content_lead",
    "content_editor",
    "script_writer",
  ),
  updateRules,
  validate,
  controller.update,
);
router.delete(
  "/:id",
  authorize("superadmin", "owner", "content_lead"),
  controller.remove,
);

export default router;
