import { Request, Response, NextFunction } from "express";
import * as Types from "../../../types";
import client from "@repo/db/client";
import argon2 from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret_key";
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "jwt_refresh_secret_key";

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

        return res.status(201).json({ id: user.id }); // return back the user ID to the client
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
    const parsedBody = Types.SigninScheme.safeParse(req.body); // Clean the input data

    if (!parsedBody.success) { // Tell the user what is wrong with their input
        return res.status(400).json({
            error: "Invalid signin data",
            details: parsedBody.error.format(),
        });
    }

    try {
        const user = await client.user.findFirst({
            where: {
                OR: [
                    { username: parsedBody.data.identifier },
                    { email: parsedBody.data.identifier }
                ]
            }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" }); // Unauthorized
        }

        const passwordValid = await argon2.verify(user.password_hash, parsedBody.data.password);

        if (!passwordValid) {
            return res.status(401).json({ error: "Invalid credentials" }); // Unauthorized again
        }

        const expires_in = 15 * 60; // 15 minutes in seconds

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: expires_in }
        );

        // 7 days in milliseconds
        const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
        const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

        const refreshRow = await client.refreshToken.create({
        data: {
            userId: user.id,
            expires_at: refreshExpiresAt,
            user_agent: req.get("User-Agent"),
            token_hash: "tmp", // will update after signing
        },
            select: { id: true },
        });

        const refresh_token = jwt.sign(
            { userId: user.id, jti: refreshRow.id },
            JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // Hash the refresh token before storing it
        // WE DONT TRUST DATABASE IN CASE OF DB LEAKS
        const tokenHash = await argon2.hash(refresh_token);

        await client.refreshToken.update({
            where: { id: refreshRow.id },
            data: { token_hash: tokenHash },
        });

        // Set the refresh token as an HttpOnly cookie
        res.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/api/v1/auth',
        });


        return res.status(200).json({ id: user.id, type: user.role, access_token: accessToken, expires_in: expires_in});
    }
    catch (error) {
        next(error);
    }
};

export const signout_post = async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies['refresh_token'];
    const auth = req.headers.authorization;
    const access_token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined; // no runtime crash

    // Check if keys exist
    if (!refresh_token || !access_token) {
        return res.status(400).json({ error: "Malformed request", details: "Missing tokens in request." });
    };

    // Check if refresh token is valid, if it is, then invalidate it in the database
    try{
        const decodedRefresh = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { userId: number };
    }
    catch{};
};