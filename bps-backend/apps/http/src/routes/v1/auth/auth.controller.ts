import { Request, Response, NextFunction } from "express";
import { client } from "@repo/db/client";
import jwt from "jsonwebtoken";
import { createId } from "@paralleldrive/cuid2";
import * as Types from "@repo/types";
import { JWT_REFRESH_SECRET, JWT_SECRET, HTTP_STATUS, ERROR_DATABASE_DATA_CONFLICT, fastHashToken, fastValidate, generateUniqueHandle, get_parsed_error_message, slowHash, slowVerify, getRejectionReason } from "@repo/helper";

const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days
const ACCESS_EXPIRY_SEC = 15 * 60; // 15 Minutes

const COOKIE_OPTS = { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", 
    sameSite: 'lax' as const, 
    path: '/api/v1/auth' 
};

export const signup_post = async (req: Request, res: Response, next: NextFunction) => {
    // Clean and get what you need from the input
    const parsed_body = Types.SignupSchema.safeParse(req.body);

    if (!parsed_body.success) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: "Invalid signup data",
            details: get_parsed_error_message(parsed_body),
            reason: await getRejectionReason()
        }).send();
    }

    try {
        // Extremly slow CPU intensive hashing algo (for low entropy guys)
        const hashed_password_promise = slowHash(parsed_body.data.password);

        const handle_promise = generateUniqueHandle();

        const [hashed_password, unique_handle] = await Promise.all([hashed_password_promise, handle_promise]);

        const user_data: any = {};
        user_data.email = parsed_body.data.email;
        user_data.name = parsed_body.data.name;
        user_data.password_hash = hashed_password;
        user_data.role = parsed_body.data.role || "USER";
        if(unique_handle) user_data.handle = unique_handle;

        const user = await client.user.create({
            data: user_data,
            select: {id: true, handle: true, role: true, name: true, email: true}
        });

        return res.status(HTTP_STATUS.CREATED).json({ message: 'User Created.', data: {user} }).send();
    }

    catch (error: any) {
        if(error.code == ERROR_DATABASE_DATA_CONFLICT){
            return res.status(HTTP_STATUS.CONFLICT).json({"error": "Email registered"}).send();
        }
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
    };

};

export const signin_post = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.SigninSchema.safeParse(req.body);

    // not clean data
    if (!parsed_body.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({error: "Invalid signin data", details: get_parsed_error_message(parsed_body), reason: await getRejectionReason()}).send();
    
    const identifier = parsed_body.data.identifier;
    const password = parsed_body.data.password;

    try {
        const user = await client.user.findUnique({
            where: identifier.includes('@') ? { email: identifier, deleted_at: null } : { handle: identifier, deleted_at: null },
            select: { id: true, handle: true, name: true, password_hash: true, email: true, role: true }
        });

        // user not there in our db
        if (!user) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "Invalid credentials" }).send();

        // Low entropy, hence the argon2
        const passwordValid = await slowVerify(user.password_hash, password);

        // wrong password given by user
        if (!passwordValid) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "Invalid credentials" }).send();

        // Make ID for refresh token
        const jti = createId();

        const refresh_token = jwt.sign(
            { user_id: user.id, jti: jti },
            JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // very fast hash since refresh_token is high entropy
        const token_hash = fastHashToken(refresh_token);

        const access_token = jwt.sign(
            { user_id: user.id, handle: user.handle, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: ACCESS_EXPIRY_SEC }
        )

        await client.refreshToken.create({
            data: {
                id: jti, // Use our own ID
                user: { connect: { id: user.id } },
                token_hash,
                expires_at: new Date(Date.now() + REFRESH_EXPIRY_MS),
                user_agent: req.headers["user-agent"] || ""
            },
            select: { id: true }
        });
        
        return res
            .cookie('refresh_token', refresh_token, COOKIE_OPTS)
            .status(HTTP_STATUS.OK)
            .json({ message: "Refresh token created.", 
                data: { 
                    user: {
                        id: user.id,
                        handle: user.handle,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    access_token,
                    expires_in: ACCESS_EXPIRY_SEC 
                } 
            });
    }
    catch (error) { next(error); };

};

export const signout_post = async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies?.refresh_token as string | undefined;

    if (!refresh_token) return res.status(HTTP_STATUS.NO_CONTENT).send();

    try {
        const decodedRefresh = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { user_id: string; jti: string };

        await client.refreshToken.update({
            where: { 
                id: decodedRefresh.jti,
                user_id: decodedRefresh.user_id,
                revoked_at: null 
            },
            data: { revoked_at: new Date() },
        });

    } finally  {
        return res
            .status(HTTP_STATUS.NO_CONTENT)
            .clearCookie("refresh_token", COOKIE_OPTS)
            .send();
    }
};

export const refresh_post = async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies?.refresh_token;

    if (!refresh_token) return res.status(HTTP_STATUS.BAD_REQUEST).json({reason: await getRejectionReason()});

    try {
        const decodedRefresh = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as { user_id: string; jti: string };

        const new_refresh_token = jwt.sign(
            { user_id: decodedRefresh.user_id, jti: decodedRefresh.jti },
            JWT_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        const new_refresh_hash = fastHashToken(new_refresh_token);

        // if it is valid, this line is run
        const row = await client.refreshToken.update({
            where: { id: decodedRefresh.jti, revoked_at: null },
            data: { expires_at: new Date(Date.now() + REFRESH_EXPIRY_MS), token_hash: new_refresh_hash },
            select: { user_id: true, token_hash: true, user: { select: { id: true, handle: true, email: true, role: true } } },
        });

        if (!(row && row.user_id === decodedRefresh.user_id && row.user)) return res.status(HTTP_STATUS.UNAUTHORIZED).send();

        // CAUGHT
        if (!fastValidate(refresh_token, row.token_hash)) return res.status(HTTP_STATUS.UNAUTHORIZED).send();

        const access_token = jwt.sign(
            { user_id: row.user.id, handle: row.user.handle, email: row.user.email, role: row.user.role },
            JWT_SECRET,
            { expiresIn: ACCESS_EXPIRY_SEC }
        );

        return res.cookie('refresh_token', new_refresh_token, COOKIE_OPTS)
            .status(HTTP_STATUS.OK)
            .json({ message: "Access Token refreshed.", 
                data: { 
                    access_token,
                    expires_in: ACCESS_EXPIRY_SEC 
                } 
            });
    }
    catch { return res.status(HTTP_STATUS.UNAUTHORIZED).send(); };
};