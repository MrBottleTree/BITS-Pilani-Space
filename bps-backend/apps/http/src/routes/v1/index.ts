import { Router } from "express";
import authRouter from "./auth/auth.routes";
import userRouter from "./user/user.controller";

const router = Router();

// Health/version ping
router.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true, version: "v1" });
});

router.use("/auth", authRouter);
router.use("/user", userRouter);

export default router;