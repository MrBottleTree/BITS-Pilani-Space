import { Request, Response, NextFunction } from "express";
import * as Types from "../../../types";
import client from "@repo/db/client";
import argon2 from "argon2";

export const signup_post = async (req: Request, res: Response, next: NextFunction) => {
    const parsedBody = Types.SignupScheme.safeParse(req.body); // Clean the input data

    if (!parsedBody.success) { // Tell the user what is wrong with their input
        return res.status(400).json({
            error: "Invalid signup data",
            details: parsedBody.error.format(),
        });
    }

    try {
        const hashed_password = await argon2.hash(parsedBody.data.password); // this is a slow operation, so awaiting basically makes the current process proceed to handle other requests.
        
        // awaiting here as well because database is slow and we can process other things
        const user = await client.user.create({
            data: {
                email: parsedBody.data.email,
                password_hash: hashed_password,
                username: parsedBody.data.username,
                role: parsedBody.data.role.toLowerCase() == "admin" ? "ADMIN" : "USER",
            }
        });

        return res.json({ id: user.id }); // return back the user ID to the client
    }

    catch (error: any) {

        if (error.code === "P2002") { // Check if the error is because of unique constraint violation
            const field = error.meta?.target?.[0] || "field";
            return res.status(409).json({
                error: `${field} already exists`,
                details: `The ${field} is already registered.`,
            });
        }

        next(error); // if not, then let express handle the error
    };
};

export const signin_post = async (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: "Signin endpoint" });
};