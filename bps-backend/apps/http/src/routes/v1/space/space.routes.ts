import { Router } from "express";
import * as spaceController from "./space.controller.js";
import { simple_middleware } from "../middleware/utils/util.middleware.js";

const router = Router();

router.post("/", simple_middleware("USER"), spaceController.add_space);
router.post("/element", simple_middleware("USER"), spaceController.add_element_to_space);
router.delete("/element", simple_middleware("USER"), spaceController.delete_element_from_space);

export default router;