import { Router } from "express";
import * as elementController from "./elements.controller.js";
import { simple_middleware } from "../middleware/utils/util.middleware.js";

const router = Router();

router.post("/", simple_middleware("ADMIN"), elementController.add_element);
router.get("/", elementController.get_all_elements);

export default router;