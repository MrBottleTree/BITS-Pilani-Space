import { Router } from "express";
import * as mapController from "./map.controller.js";
import { simple_middleware } from "../middleware/utils/util.middleware.js";

const router = Router();

router.post("/", simple_middleware("ADMIN"), mapController.add_map);
router.get("/:id", mapController.get_map);

export default router;