import { Router } from "express";
import * as controller from "./clients.controller.js";
import { createRules, updateRules } from "./clients.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import authorize from "../../middlewares/authorize.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.use(authenticate);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post(
  "/",
  authorize("superadmin", "owner"),
  createRules,
  validate,
  controller.create,
);
router.put(
  "/:id",
  authorize("superadmin", "owner"),
  updateRules,
  validate,
  controller.update,
);
router.delete("/:id", authorize("superadmin"), controller.remove);

export default router;
