import { Router } from "express";
import * as controller from "./auth.controller.js";
import { loginRules, refreshRules } from "./auth.validation.js";
import authenticate from "../../middlewares/authenticate.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.post("/login", loginRules, validate, controller.login);
router.post("/refresh", refreshRules, validate, controller.refresh);
router.post("/logout", refreshRules, validate, controller.logout);
router.get("/me", authenticate, controller.me);

export default router;