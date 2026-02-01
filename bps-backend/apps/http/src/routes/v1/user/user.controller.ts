import { Request, Response, NextFunction } from "express";
import { client } from "@repo/db/client";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as Types from "@repo/types";
import { getRejectionReason, HTTP_STATUS } from "@repo/helper";
import { get_parsed_error_message, slowHash, slowVerify } from "@repo/helper";

export const delete_user = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    // Just for safety
    if(!user) return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "user not defined after parsing through middleware"}).send();

    // Here onwards i am assuming that the user is properly verified and stuff
    try {
        const updated_user = await client.user.update({
            where: { id: user.user_id },
            data: { deleted_at: new Date() },
            select: { id: true, deleted_at: true }
        });

        return res.status(HTTP_STATUS.OK).json({message: "User set to delete.", data: {user: update_user}}).send();
    }
    catch {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "error in database operation", reason: await getRejectionReason()});
    }
};

export const update_user = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.UpdateUserSchema.safeParse(req.body);

    if(!parsed_body.success) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Error parsing the body", "details": get_parsed_error_message(parsed_body), reason: await getRejectionReason()});
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
            where: {id: current_user.user_id},
            select: {id: true, handle: true, email: true, password_hash: true}
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

        const new_handle = parsed_body.data.user.new_handle;
        const new_email = parsed_body.data.user.new_email;
        const new_avatar = parsed_body.data.user.new_avatar;
        const new_name = parsed_body.data.user.new_name;

        // If user wants to update atleast one if username or email
        if(new_handle || new_email){
            // Check and return if new username or new email is not unique
            const [username_check, email_check] = await Promise.all([
                new_handle && new_handle !== stored_cur_user.handle
                    ? client.user.findUnique({ where: { handle: new_handle }, select: {id: true} })
                    : null,

                new_email && new_email !== stored_cur_user.email
                    ? client.user.findUnique({ where: { email: new_email }, select: {id: true} })
                    : null
                ]);

            if(username_check && username_check.id != stored_cur_user.id){
                res.status(HTTP_STATUS.CONFLICT).json({"error": "Handle Taken"});
                return;
            }

            if(email_check && email_check.id != stored_cur_user.id){
                res.status(HTTP_STATUS.CONFLICT).json({"error": "Email already registered"});
                return;
            }
        }

        const updated_data: any = {};

        const new_password = parsed_body.data.user.new_password;
        
        if(new_handle) updated_data.handle = new_handle;
        if(new_email) updated_data.email = new_email;
        if(new_avatar) updated_data.avatar_id = new_avatar;
        if(new_name) updated_data.name = new_name;
        if(new_password) updated_data.password_hash = await slowHash(new_password);

        const updated_user = await client.user.update({
            where: { id: stored_cur_user.id },
            data: updated_data,
            select: { id: true, name: true, handle: true, email: true, role: true }
        });

        res.status(HTTP_STATUS.OK).json({message: "User updated.", data: {user: updated_user}});
    }
    catch(err){
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        return next(err);
    }
};

export const get_user = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if(!user) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Missing user", reason: await getRejectionReason()});

    try{
        const stored_user = await client.user.findUnique({
            where: { id: user.user_id },
            select: {
                id: true,
                handle: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
                updated_at: true
            }
        });

        if (!stored_user) {
             return res.status(HTTP_STATUS.NOT_FOUND).json({"error": "User not found"});
        }

        return res.status(HTTP_STATUS.OK).json({message: "ok", data: {user: stored_user}});
    }
    catch(err){
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
    }
};

export const get_many_users = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.GetManyUserAvatars.safeParse(req.body);
    if(!parsed_body.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Error parsing the body", "details": get_parsed_error_message(parsed_body), reason: await getRejectionReason()});
        return
    }

    try{
        const db_resp = await client.user.findMany({
            where: {id: { in: parsed_body.data.user_ids } },
            select:{
                id: true,
                name: true,
                handle: true,
                avatar: {
                    select: {
                        id: true,
                        image_key: true
                    }
                }
            }
        });

        res.status(HTTP_STATUS.OK).json({message: "ok", data: { avatars: db_resp }});
    }
    catch{
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
    }
};