import { Router } from "express";
import * as authController from "./auth.controller.js";

const router = Router();

router.post("/signup", authController.signup_post);
router.post("/signin", authController.signin_post);
router.post("/signout", authController.signout_post);
router.post("/refresh", authController.refresh_post);

export default router;