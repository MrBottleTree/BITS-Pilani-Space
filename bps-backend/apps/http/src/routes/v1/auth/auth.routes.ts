import { Router } from "express";
import * as authController from "./auth.controller";

const router = Router();

router.get("/signup", authController.signup);
router.get("/signin", authController.signin);

export default router;