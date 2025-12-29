import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../../../config.js";
import * as Types from "../../../types/index.js"
import { deleteFile, get_parsed_error_message, uploadFile } from "../utils/helper.js";
import { client } from "@repo/db";

export const add_avatar = async (req: Request, res: Response, next: NextFunction) => {
    const uploaded_file = req.file;
    
    if(!uploaded_file){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "no file uploaded"});
        return;
    }

    const metadata = Types.AvatarMetadataSchema.safeParse(req.body);
    const actual_file = Types.AvatarFileSchema.safeParse(req.file);

    if(!metadata.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "bad metadata", "details": get_parsed_error_message(metadata)});
        return;
    }

    if(!actual_file.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "bad file", "details": get_parsed_error_message(actual_file)});
        return;
    }

    const current_user = req.user;

    if(!current_user){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error":"User not found"});
        return;
    }
    const key = `avatars/${Date.now()}_${actual_file.data.originalname}`;
    
    const s3_promise = uploadFile(key, actual_file.data.buffer, actual_file.data.mimetype);
    const db_promise = client.avatar.create({
        data: {
            name: metadata.data.name,
            imageURL: key,
            created_by: { connect: { id: current_user.userId } }
        },
        select: { id: true, imageURL: true, name: true }
    });

    // Wait for BOTH to finish completely
    const [s3Result, dbResult] = await Promise.allSettled([s3_promise, db_promise]);

    if (s3Result.status === 'fulfilled' && dbResult.status === 'fulfilled') {
        const stored_avatar = dbResult.value;
        
        return res.status(HTTP_STATUS.OK).json({
            message: "avatar created successfully",
            avatar: stored_avatar
        });
    }

    console.error("Upload failed. Rolling back...");

    if (dbResult.status === 'fulfilled') {
        const idToDelete = dbResult.value.id;
        await client.avatar.delete({ where: { id: idToDelete } });
        console.log("Rolled back Database record");
    }

    if (s3Result.status === 'fulfilled') {
        await deleteFile(key);
        console.log("Rolled back S3 file");
    } else {
        await deleteFile(key).catch(() => {}); 
    }

    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
        error: "Upload failed", 
        details: "Transaction rolled back." 
    });
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
                imageURL: true,
                created_at: true,
                created_by: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });

        if (!avatar) {
            res.status(HTTP_STATUS.NOT_FOUND).json({ error: "Avatar not found" });
            return;
        }

        res.status(HTTP_STATUS.OK).json({ data: avatar });

    } catch (err) {
        console.error("Error fetching avatar:", err);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Internal Server Error" });
    }
};