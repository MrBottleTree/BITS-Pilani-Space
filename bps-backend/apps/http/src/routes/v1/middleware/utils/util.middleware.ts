import { NextFunction, request, Request, Response } from "express";
import * as Types from "../../../../types/index.js";
import { HTTP_STATUS, JWT_SECRET } from "../../../../config.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import { REQUEST_HANDLED, REQUEST_NOTHANDLED } from "../../../../config.js";
import { client } from "@repo/db";


export const simple_middleware = (request_role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const parsed_header = Types.AuthorizationHeaderSchema.safeParse(req.headers);

        if(!parsed_header.success) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                "error": "Bad Request",
                "details": parsed_header.error
            }).end();
            return REQUEST_HANDLED;
        }

        const auth_token = parsed_header.data.authorization;
        if(!auth_token){
            res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "no auth token found"}).end();
            return REQUEST_HANDLED;
        } 

        try{
            const decoded_auth = jwt.verify(auth_token, JWT_SECRET);
            
            // doing some safety checks here itself to remove the complexity from the controller side
            const parsed_auth = Types.UserSchema.safeParse(decoded_auth)

            if(!parsed_auth.success) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({
                    "error": "Parsing error",
                    "details": parsed_auth.error
                }).end();
                return REQUEST_HANDLED;
            }

            if(parsed_auth.data.role != request_role){
                res.status(HTTP_STATUS.UNAUTHORIZED).end();
                return REQUEST_HANDLED;
            }


            req.user = parsed_auth.data;
            return REQUEST_NOTHANDLED;
        }
        catch (error){
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                "error": "Bad Request",
                "details": error
            }).end();
            return REQUEST_HANDLED;
        }
    };
};

// very slow, database operation is there
export const strong_middleware = (request_role: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {

        if(simple_middleware(request_role)(req, res, next) === REQUEST_HANDLED) return;

        const user = req.user;

        // for safety
        if(!user) {
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "user not defined in request"}).end();
            return REQUEST_HANDLED;
        }

        const incoming_userid = req.body.id;
        const incoming_password = req.body.password;

        if(!incoming_password || !incoming_userid) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "userid or password not given"}).end();
            return REQUEST_HANDLED;
        }

        if(user.userId !== incoming_userid) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "userid in the body does not match the access token user id"}).end();
            return REQUEST_HANDLED;
        }
        try{
            const stored_user = await client.user.findUnique({
                where: { id: incoming_userid },
                select: { id: true, role: true, password_hash: true, deleted_at: true}
            });

            if(!stored_user) {
                res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "user not found in database"}).end();
                return REQUEST_HANDLED;
            }
            if(stored_user.role != request_role) {res.status(HTTP_STATUS.UNAUTHORIZED).json({"error": `not of \"${request_role}\" role`}).end(); return REQUEST_HANDLED;}
            if(stored_user.deleted_at) {res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "User marked as deleted"}).end(); return REQUEST_HANDLED;}

            const password_verification = await argon2.verify(stored_user.password_hash, incoming_password);

            if(!password_verification) {res.status(HTTP_STATUS.UNAUTHORIZED).json({"error": "wrong password"}).end(); return REQUEST_HANDLED;}

            // if all the checks pass, then go ahead
            next();
            return REQUEST_NOTHANDLED;
        }
        catch(err) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "user not found in database", "details": err}).end();
            return REQUEST_HANDLED
        }
    };
};