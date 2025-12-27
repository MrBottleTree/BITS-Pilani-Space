import { Request, Response, NextFunction } from "express";
import { client } from "@repo/db/client";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as Types from "../../../types/index.js";
import { HTTP_STATUS } from "../../../config.js";

export const delete_post = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    Types.SigninScheme
    // Just for safety
    if(!user) return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "user not defined after parsing through middleware"});

    // Here onwards i am assuming that the user is properly verified and stuff
    try {
        const updated_user = await client.user.update({
            where: { id: user.userId },
            data: { deleted_at: new Date() },
            select: { deleted_at: true }
        });

        return res.status(HTTP_STATUS.OK).json({"userId": user.userId, "deleted_at": updated_user.deleted_at});
    }
    catch {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "error in database operation"});
    }
};