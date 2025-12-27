import { Router } from "express";
import * as adminController from "./admin.controller.js";
import * as middleware from "../middleware/utils/util.middleware.js";

const router = Router();

router.delete("/batch", middleware.strong_middleware("ADMIN"), adminController.batch_delete);

export default router;