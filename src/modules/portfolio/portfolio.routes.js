import { Router } from "express";
import * as controller from "./portfolio.controller.js";
import { createRules, updateRules } from "./portfolio.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.post(
  "/",
  authenticate,
  authorize("superadmin", "owner"),
  createRules,
  validate,
  controller.create,
);
router.put(
  "/:id",
  authenticate,
  authorize("superadmin", "owner"),
  updateRules,
  validate,
  controller.update,
);
router.delete(
  "/:id",
  authenticate,
  authorize("superadmin", "owner"),
  controller.remove,
);

export default router;
