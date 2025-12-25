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
        }).end();
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

        return res.status(201).json({ id: user.id }).end(); // return back the user ID to the client
    }

    catch (error: any) {

        res.status(409).json({"error": "Email or username already exists"}).end(); // Conflict, probably email or username already exists

        return;
    };

};

export const signin_post = async (req: Request, res: Response, next: NextFunction) => {
    const parsedBody = Types.SigninScheme.safeParse(req.body); // Clean the input data

    if (!parsedBody.success) { // Tell the user what is wrong with their input
        return res.status(400).json({error: "Invalid signin data", details: parsedBody.error.format()}).end();
    }

    try {
        // identifier is both username and email
        const user = await client.user.findFirst({
            where: {
                OR: [
                    { username: parsedBody.data.identifier },
                    { email: parsedBody.data.identifier }
                ]
            }
        });

        if (!user) {
            // Unauthorized
            return res.status(401).json({ error: "Invalid credentials" }).end();
        }

        const passwordValid = await argon2.verify(user.password_hash, parsedBody.data.password);

        if (!passwordValid) {
            // Unauthorized again
            return res.status(401).json({ error: "Invalid credentials" }).end();
        }

        // 7 days in milliseconds
        const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
        const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

        const refreshRow_promise = client.refreshToken.create({
            data: {
                userId: user.id,
                expires_at: refreshExpiresAt,
                user_agent: req.get("User-Agent"),
                token_hash: "tmp", // will update after signing
            },
            select: { id: true },
        });

        const expires_in = 15 * 60; // 15 minutes in seconds

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: expires_in }
        );

        const refreshRow =  await refreshRow_promise;

        const refresh_token = jwt.sign(
            { userId: user.id, jti: refreshRow.id },
            JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // Set the refresh token as an HttpOnly cookie
        // close the connection as soon as possible
        res.status(200)
        .cookie('refresh_token', refresh_token, {httpOnly: true, secure: false, sameSite: 'lax', path: '/api/v1/auth',})
        .json({ id: user.id, role: user.role, access_token: accessToken, expires_in: expires_in})
        .end();

        // Hash the refresh token before storing it
        // WE DONT TRUST DATABASE IN CASE OF DB LEAKS
        const tokenHash = await argon2.hash(refresh_token);

        await client.refreshToken.update({
            where: { id: refreshRow.id },
            data: { token_hash: tokenHash },
        });

        return;
    }
    catch (error) {
        next(error);
    }
};

export const signout_post = async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies?.refresh_token as string | undefined;

    if (!refresh_token) {
        return res.status(400).end(); // no refresh token, no signout needed
    }

    try {
        const decodedRefresh = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { userId: string; jti: string };

        const row = await client.refreshToken.findUnique({
            where: { id: decodedRefresh.jti },
            select: { id: true, userId: true, revoked_at: true },
        });

        if (row && row.userId === decodedRefresh.userId && !row.revoked_at) {

            // invalidate the cookie on client side
            res.clearCookie("refresh_token", { path: "/api/v1/auth" }).status(204).end();

            await client.refreshToken.update({
                where: { id: row.id },
                data: { revoked_at: new Date() },
            });

            return;
        }
        else{
            return res.status(401).end();
        }
    }
    catch {
        return res.status(401).end();
    }
};

export const refresh_post = async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies?.refresh_token as string | undefined;

    if (!refresh_token) {
        return res.status(400).end(); // no refresh token, no signout needed
    }

    try {
        const decodedRefresh = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { userId: string; jti: string };

        // if it is valid, this line is run
        const row = await client.refreshToken.findUnique({
            where: { id: decodedRefresh.jti },
            select: { userId: true, revoked_at: true, user: { select: { id: true, email: true, role: true } } },
        });

        if (!(row && row.userId === decodedRefresh.userId && !row.revoked_at)) return res.status(401).end();

        const expires_in = 15 * 60; // 15 minutes in seconds

        const accessToken = jwt.sign(
            { userId: row.user.id, email: row.user.email, role: row.user.role },
            JWT_SECRET,
            { expiresIn: expires_in }
        );

        return res.status(200).json({ access_token: accessToken, expires_in: expires_in }).end();
    }
    catch {
        return res.status(401).end();
    };
};