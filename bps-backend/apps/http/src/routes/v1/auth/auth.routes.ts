import { Router } from "express";
import * as authController from "./auth.controller";

const router = Router();

router.post("/signup", authController.signup_post);
router.post("/signin", authController.signin_post);

export default router;