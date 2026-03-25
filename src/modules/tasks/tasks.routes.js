import { Router } from "express";
import * as controller from "./tasks.controller.js";
import { createRules, updateRules } from "./tasks.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post(
  "/",
  authorize("superadmin", "owner", "content_lead"),
  createRules,
  validate,
  controller.create,
);
router.put(
  "/:id",
  authorize("superadmin", "owner", "content_lead"),
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
