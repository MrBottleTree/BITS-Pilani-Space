import { Request, Response, NextFunction } from "express";
import { client } from "@repo/db/client";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as Types from "../../../types/index.js";
import { HTTP_STATUS } from "../../../config.js";
import { get_parsed_error_message, slowHash, slowVerify } from "../utils/helper.js";

export const delete_user = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // Just for safety
    if(!user) return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "user not defined after parsing through middleware"}).send();

    // Here onwards i am assuming that the user is properly verified and stuff
    try {
        const updated_user = await client.user.update({
            where: { id: user.userId },
            data: { deleted_at: new Date() },
            select: { deleted_at: true }
        });

        return res.status(HTTP_STATUS.OK).json({"userId": user.userId, "deleted_at": updated_user.deleted_at}).send();
    }
    catch {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "error in database operation"}).send();
    }
};

export const update_user = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.UpdateUserSchema.safeParse(req.body);

    if(!parsed_body.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Error parsing the body", "details": get_parsed_error_message(parsed_body)});
        return;
    }

    try{
        const current_user = req.user;

        // Something is seriously wrong
        if(!current_user){
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
            return;
        }

        const stored_cur_user = await client.user.findUnique({
            where: {id: current_user.userId},
            select: {id: true, username: true, email: true, password_hash: true}
        });

        // Not even possible, something terrible wrong!!
        if(!stored_cur_user){
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
            return;
        }

        const match = await slowVerify(stored_cur_user.password_hash, parsed_body.data.password);

        // user gave wrong password
        if(!match){
            res.status(HTTP_STATUS.FORBIDDEN).send();
            return;
        }

        const new_username = parsed_body.data.user.new_username;
        const new_email = parsed_body.data.user.new_email;
        const new_avatar = parsed_body.data.user.new_avatar;

        // If user wants to update atleast one if username or email
        if(new_username || new_email){
            // Check and return if new username or new email is not unique
            const [username_check, email_check] = await Promise.all([
                new_username && new_username !== stored_cur_user.username
                    ? client.user.findUnique({ where: { username: new_username }, select: {id: true} })
                    : null,

                new_email && new_email !== stored_cur_user.email
                    ? client.user.findUnique({ where: { email: new_email }, select: {id: true} })
                    : null
                ]);
            
            if(username_check && username_check.id != stored_cur_user.id){
                res.status(HTTP_STATUS.CONFLICT).json({"error": "Username Taken"});
                return;
            }

            if(email_check && email_check.id != stored_cur_user.id){
                res.status(HTTP_STATUS.CONFLICT).json({"error": "Email already registered"});
                return;
            }
        }

        const updated_data: any = {};

        const new_password = parsed_body.data.user.new_password;
        
        if(new_username) updated_data.username = new_username;
        if(new_email) updated_data.email = new_email;
        if(new_avatar) updated_data.avatarId = new_avatar
        if(new_password) updated_data.password_hash = await slowHash(new_password);

        const updated_user = await client.user.update({
            where: { id: stored_cur_user.id },
            data: updated_data,
            select: { id: true, username: true, email: true, role: true }
        });

        res.status(HTTP_STATUS.OK).json({"message":"User updated", "user": updated_user});
    }
    catch(err){
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        return next(err);
    }
};

export const get_user = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if(!user) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Missing user"});

    try{
        const stored_user = await client.user.findUnique({
            where: { id: user.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                created_at: true,
            }
        });

        if (!stored_user) {
             return res.status(HTTP_STATUS.NOT_FOUND).json({"error": "User not found"});
        }

        return res.status(HTTP_STATUS.OK).json({"user": stored_user});
    }
    catch(err){
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
    }
};
