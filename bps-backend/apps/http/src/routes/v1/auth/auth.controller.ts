// src/routes/v1/auth/auth.controller.ts
import { Request, Response, NextFunction } from "express";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: "Signup endpoint" });
};

export const signin = async (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: "Signin endpoint" });
};