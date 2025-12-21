import { Router } from "express";

export const router = Router();

router.get("/auth/signup", (req, res) => {
    res.json({ message: "Signup route" });
});