import { Router } from "express";
import multer from "multer";
import * as avatarController from "./avatar.controller.js";
import { simple_middleware } from "../middleware/utils/util.middleware.js";

const router = Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post("/", simple_middleware("ADMIN"), upload.single("avatar"), avatarController.add_avatar);
router.get("/:id", avatarController.get_avatar);

export default router;