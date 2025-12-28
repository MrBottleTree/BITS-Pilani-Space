import { Router } from "express";
import * as userController from "./user.controller.js";
import * as middleware from "../middleware/utils/util.middleware.js";

const router = Router();

router.delete("/me", middleware.strong_middleware("USER"), userController.delete_user);
router.patch("/me", middleware.strong_middleware("USER"), userController.update_user);
router.get("/me", middleware.simple_middleware("USER"), userController.get_user);

export default router;