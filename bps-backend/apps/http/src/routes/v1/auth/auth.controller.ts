import { Request, Response, NextFunction } from "express";
import { client } from "@repo/db/client";
import jwt from "jsonwebtoken";
import { createId } from "@paralleldrive/cuid2";
import * as Types from "../../../types/index.js";
import { JWT_REFRESH_SECRET, JWT_SECRET, HTTP_STATUS } from "../../../config.js";
import { fastHashToken, fastValidate, get_parsed_error_message, slowHash, slowVerify } from "../utils/helper.js";


const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days
const ACCESS_EXPIRY_SEC = 5 * 60; // 5 Minutes
const COOKIE_OPTS = { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", 
    sameSite: 'lax' as const, 
    path: '/api/v1/auth' 
};

export const signup_post = async (req: Request, res: Response, next: NextFunction) => {
    // Clean and get what you need from the input
    const parsedBody = Types.SignupSchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: "Invalid signup data",
            details: get_parsed_error_message(parsedBody)
        }).send();
    }

    try {
        // Extremly slow CPU intensive hashing algo (for low entropy guys)
        const hashed_password = await slowHash(parsedBody.data.password);

        const user = await client.user.create({
            data: {
                email: parsedBody.data.email,
                password_hash: hashed_password,
                username: parsedBody.data.username,
                role: parsedBody.data.role == "ADMIN"? "ADMIN": "USER" //safer this way
            },
            select: {id: true} // only need ID, not the entire row
        });

        return res.status(HTTP_STATUS.CREATED).json({ id: user.id }).send();
    }

    catch (error: any) {
        return res.status(HTTP_STATUS.CONFLICT).json({"error": "Email or username already exists", details: error}).send(); // Conflict, probably email or username already exists
    };

};

export const signin_post = async (req: Request, res: Response, next: NextFunction) => {
    const parsedBody = Types.SigninSchema.safeParse(req.body);

    // not clean data
    if (!parsedBody.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({error: "Invalid signin data", details: get_parsed_error_message(parsedBody)}).send();
    
    const identifier = parsedBody.data.identifier;
    const password = parsedBody.data.password;

    try {
        const user = await client.user.findUnique({
            where: identifier.includes('@') ? { email: identifier, deleted_at: null } : { username: identifier, deleted_at: null },
            select: { id: true, username: true, password_hash: true, email: true, role: true }
        });

        // user not there in our db
        if (!user) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "Invalid credentials", details: "User not found in the database" }).send();

        // Low entropy, hence the argon2
        const passwordValid = await slowVerify(user.password_hash, password);

        // wrong password given by user
        if (!passwordValid) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "Invalid credentials", details: "Password does not match" }).send();

        // Make ID for refresh token
        const jti = createId();

        const refresh_token = jwt.sign(
            { userId: user.id, jti: jti },
            JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // very fast hash since refresh_token is high entropy
        const token_hash = fastHashToken(refresh_token);

        const access_token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: ACCESS_EXPIRY_SEC }
        )

        await client.refreshToken.create({
            data: {
                id: jti, // Use our own ID
                userId: user.id,
                token_hash,
                expires_at: new Date(Date.now() + REFRESH_EXPIRY_MS),
                user_agent: req.headers["user-agent"] || ""
            },
            select: { id: true }
        });
        
        return res
            .cookie('refresh_token', refresh_token, COOKIE_OPTS)
            .status(HTTP_STATUS.OK)
            .json({ id: user.id, role: user.role, access_token: access_token, expires_in: ACCESS_EXPIRY_SEC});
    }
    catch (error) { next(error); };

};

export const signout_post = async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies?.refresh_token as string | undefined;

    if (!refresh_token) return res.status(HTTP_STATUS.BAD_REQUEST).send();

    try {
        const decodedRefresh = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { userId: string; jti: string };

        const row = await client.refreshToken.findUnique({
            where: { id: decodedRefresh.jti },
            select: { id: true, userId: true, revoked_at: true },
        });

        if (row && row.userId === decodedRefresh.userId && !row.revoked_at) {

            // invalidate the cookie on client side
            res.clearCookie("refresh_token", { path: "/api/v1/auth" });

            await client.refreshToken.update({
                where: { id: row.id },
                data: { revoked_at: new Date() },
            });

            return res.status(HTTP_STATUS.NO_CONTENT).send();
        }
        return res.status(HTTP_STATUS.UNAUTHORIZED).send();
    }
    catch { return res.status(HTTP_STATUS.UNAUTHORIZED).send(); };
};

export const refresh_post = async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies?.refresh_token;

    if (!refresh_token) return res.status(HTTP_STATUS.BAD_REQUEST).send();

    try {
        const decodedRefresh = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { userId: string; jti: string };

        // if it is valid, this line is run
        const row = await client.refreshToken.findUnique({
            where: { id: decodedRefresh.jti },
            select: { userId: true, revoked_at: true, token_hash: true, user: { select: { id: true, email: true, role: true } } },
        });

        if (!(row && row.userId === decodedRefresh.userId && !row.revoked_at)) return res.status(HTTP_STATUS.UNAUTHORIZED).send();

        // CAUGHT
        if (!fastValidate(refresh_token, row.token_hash)) return res.status(HTTP_STATUS.UNAUTHORIZED).send();

        const access_token = jwt.sign(
            { userId: row.user.id, email: row.user.email, role: row.user.role },
            JWT_SECRET,
            { expiresIn: ACCESS_EXPIRY_SEC }
        );

        return res.status(HTTP_STATUS.OK).json({ access_token, expires_in: ACCESS_EXPIRY_SEC }).send();
    }
    catch { return res.status(HTTP_STATUS.UNAUTHORIZED).send(); };
};