import { NextFunction, Request, Response } from "express";
import * as Types from "../../../types/index.js";
import { HTTP_STATUS, JWT_SECRET } from "../../../config.js";
import jwt from "jsonwebtoken";
import { client } from "@repo/db";
import argon2 from "argon2";


export const user_simple_middleware = (req: Request, res: Response, next: NextFunction) => {
    const parsed_header = Types.AuthorizationHeaderSchema.safeParse(req.headers);

    if(!parsed_header.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({
        "error": "Bad Request",
        "details": parsed_header.error
    });

    const auth_token = parsed_header.data.authorization;
    if(!auth_token) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "no auth token found"});

    try{
        const decoded_auth = jwt.verify(auth_token, JWT_SECRET);
        
        // doing some safety checks here itself to remove the complexity from the controller side
        const parsed_auth = Types.UserScheme.safeParse(decoded_auth)
        if(!parsed_auth.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({
            "error": "Parsing error",
            "details": parsed_auth.error.format()
        });

        req.user = parsed_auth.data;
        next();
    }
    catch (error){
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            "error": "Bad Request",
            "details": error
        });
    }
};

// single but slower database operation
export const user_strong_middleware = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // for safety
    if(!user) return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "user not defined in request"});

    const incoming_userid = req.body.id;
    const incoming_password = req.body.password;

    if(!incoming_password || !incoming_userid) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "userid or password not given"});

    if(user.userId !== incoming_userid) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "userid in the body does not match the access token user id"});

    try{
        const stored_user = await client.user.findUnique({
            where: { id: incoming_userid },
            select: { id: true, role: true, password_hash: true, deleted_at: true}
        });

        if(!stored_user) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "user not found in database"});

        if(stored_user.role != "USER") return res.status(HTTP_STATUS.UNAUTHORIZED).json({"error": "not of \"USER\" role"});
        if(stored_user.deleted_at) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "User marked as deleted"});

        const password_verification = await argon2.verify(stored_user.password_hash, incoming_password);

        if(!password_verification) return res.status(HTTP_STATUS.UNAUTHORIZED).json({"error": "wrong password"});

        // if all the checks pass, then go ahead
        next();
    }
    catch(err) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "user not found in database", "details": err});
    }
};