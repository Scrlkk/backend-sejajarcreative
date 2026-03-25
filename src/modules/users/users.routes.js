import { Router } from "express";
import * as controller from "./users.controller.js";
import { createRules, updateRules } from "./users.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.use(authenticate);
router.get("/", authorize("superadmin", "owner"), controller.getAll);
router.get("/:id", authorize("superadmin", "owner"), controller.getById);
router.post(
  "/",
  authorize("superadmin"),
  createRules,
  validate,
  controller.create,
);
router.put(
  "/:id",
  authorize("superadmin"),
  updateRules,
  validate,
  controller.update,
);
router.delete("/:id", authorize("superadmin"), controller.remove);

export default router;
