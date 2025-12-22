import { Router } from "express";
import authRouter from "./auth/auth.routes";

const router = Router();

// Health/version ping
router.get("/health", (req, res) => {
  res.status(200).json({ ok: true, version: "v1" });
});

router.use("/auth", authRouter);

export default router;