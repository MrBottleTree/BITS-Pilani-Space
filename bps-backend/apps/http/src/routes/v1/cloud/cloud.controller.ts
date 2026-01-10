import { Request, Response, NextFunction } from "express";
import * as Types from "@repo/types"
import { HTTP_STATUS } from "@repo/helper";
import { deleteFile, get_parsed_error_message, uploadFile } from "@repo/helper";
import { client } from "@repo/db";
import { randomUUID } from 'crypto';
import path from 'path';

export const upload_image = async (req: Request, res: Response, next: NextFunction) => {
    const uploaded_file = req.file;
    
    if(!uploaded_file){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "no file uploaded"});
        return;
    }

    const metadata = Types.ImageMetadataSchema.safeParse(req.body);
    const actual_file = Types.ImageFileSchema.safeParse(req.file);

    if(!metadata.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "bad metadata", "details": get_parsed_error_message(metadata)});
        return;
    }

    if(!actual_file.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "bad file", "details": get_parsed_error_message(actual_file)});
        return;
    }

    const current_user = req.user;

    // Should not happen because of middleware
    if(!current_user){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error":"User not found"});
        return;
    }

    const fileExtension = path.extname(actual_file.data.originalname).toLowerCase();
    const key = `${actual_file.data.fieldname}/${randomUUID()}${fileExtension}`;

    const [s3_upload] = await Promise.allSettled([uploadFile(key, actual_file.data.buffer, actual_file.data.mimetype)]);

    if(s3_upload.status === 'fulfilled'){
        res.status(HTTP_STATUS.OK).json({
            message: "Uploaded to cloud.",
            data: { key }
        });
        return
    }

    // Try to rollback if any issue
    try{
        await deleteFile(key);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "Upload failed"});
    }
    catch{
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "Upload failed and rollback also failed"});
    }
};