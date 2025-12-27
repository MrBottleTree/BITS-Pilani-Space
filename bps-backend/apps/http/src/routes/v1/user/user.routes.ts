import { Router } from "express";
import * as userController from "./user.controller.js";
import * as middleware from "../middleware/user.js";

const router = Router();

router.delete("/me", middleware.user_simple_middleware, middleware.user_strong_middleware, userController.delete_user);

export default router;