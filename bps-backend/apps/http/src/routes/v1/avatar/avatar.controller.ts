import { NextFunction, Request, Response } from "express";
import { ERROR_DATABASE_DATA_CONFLICT, HTTP_STATUS } from "../../../config.js";
import * as Types from "../../../types/index.js"
import { checkFileExists, deleteFile, get_parsed_error_message, uploadFile } from "../utils/helper.js";
import { client } from "@repo/db";

export const add_avatar = async (req: Request, res: Response, next: NextFunction) => {
    const current_user = req.user;
    
    // shouldnt happen but ok
    if(!current_user) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "user not found in request"});

    const parsed_body = Types.AddAvatarSchema.safeParse(req.body);

    if(!parsed_body.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error":"error parsing the body", "details": get_parsed_error_message(parsed_body)});
        return
    }

    try{
        // get the key and the name
        const key = parsed_body.data.image_key;
        const name = parsed_body.data.name;

        // verify if they key exists in the S3 bucket
        const check = await checkFileExists(key);
        if(!check){
            res.status(HTTP_STATUS.NOT_FOUND).json({"error": "no such key exists in the storage"});
            return
        }

        // here onwards, the image exists in the s3 bucket
        // start to store the key in db or something
    
        // check for unique constraint
        try{
            const db_response = await client.avatar.create({
                data: {
                    name,
                    image_key: key,
                    created_by: { connect: { id: current_user.user_id }}
                },
                select: {
                    id: true,
                    name: true,
                    image_key: true,
                    created_at: true
                }
            });

            res.status(HTTP_STATUS.OK).json({
                "message": "Avatar added.",
                data: { avatar: db_response }
            });

            return;
        }
        catch(err: any) {
            if(err.code == ERROR_DATABASE_DATA_CONFLICT) return res.status(HTTP_STATUS.CONFLICT).json({"error": "Avatar with exact key exists"});
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        }
    }
    catch {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        return
    }
};

export const get_avatar = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "Avatar ID is required" });
        return;
    }

    try {
        const avatar = await client.avatar.findUnique({
            where: { id: id },
            select: {
                id: true,
                name: true,
                image_key: true,
                updated_at: true,
                created_by: {
                    select: {
                        id: true,
                        handle: true
                    }
                }
            }
        });

        if (!avatar) {
            res.status(HTTP_STATUS.NOT_FOUND).json({ error: "Avatar not found" });
            return;
        }

        res.status(HTTP_STATUS.OK).json({ message: "Avatar found.", data: { avatar } });

    } catch (err) {
        console.error("Error fetching avatar:", err);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
    }
};

export const get_all_avatar = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const avatars = await client.avatar.findMany({
            where: { deleted_at: null },
            select: { id: true, name: true, image_key: true }
        });

        res.status(HTTP_STATUS.OK).json({
            message: "ok",
            data: {avatars, count: avatars.length}
        });
        return
    }

    catch{
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        return
    }
};