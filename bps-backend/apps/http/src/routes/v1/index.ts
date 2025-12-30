import { Router } from "express";
import authRouter from "./auth/auth.routes.js";
import userRouter from "./user/user.routes.js";
import adminRouter from "./admin/admin.routes.js";
import avatarRouter from "./avatar/avatar.routes.js";

const router = Router();

// Health/version ping
router.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true, version: "v1" });
});

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/admin", adminRouter);
router.use("/avatar", avatarRouter);

export default router;