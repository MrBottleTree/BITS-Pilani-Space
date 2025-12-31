import { Router } from "express";
import multer from "multer";
import * as cloudController from "./cloud.controller.js";
import { simple_middleware } from "../middleware/utils/util.middleware.js";

const router = Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.post("/upload", simple_middleware("ADMIN"), upload.single("images"), cloudController.upload_image);

export default router;