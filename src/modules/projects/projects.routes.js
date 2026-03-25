import { Router } from "express";
import * as controller from "./projects.controller.js";
import {
  createRules,
  updateRules,
  memberRules,
} from "./projects.validation.js";
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
router.delete("/:id", authorize("superadmin", "owner"), controller.remove);

router.get("/:id/members", controller.getMembers);
router.post(
  "/:id/members",
  authorize("superadmin", "owner", "content_lead"),
  memberRules,
  validate,
  controller.addMember,
);
router.delete(
  "/:id/members/:userId",
  authorize("superadmin", "owner", "content_lead"),
  controller.removeMember,
);

export default router;
