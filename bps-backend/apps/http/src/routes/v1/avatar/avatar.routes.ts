import { Router } from "express";
import * as avatarController from "./avatar.controller.js";
import { simple_middleware } from "../middleware/utils/util.middleware.js";

const router = Router();

router.post("/", simple_middleware("ADMIN"), avatarController.add_avatar);

export default router;