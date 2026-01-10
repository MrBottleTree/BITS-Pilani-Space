import { NextFunction, Request, Response } from "express";
import { BatchUserDeletionSchema } from "@repo/types";
import { HTTP_STATUS, get_parsed_error_message } from "@repo/helper";
import { parse } from "dotenv";
import { client } from "@repo/db";

// 2 database operations, but not very slow!
export const batch_delete = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = BatchUserDeletionSchema.safeParse(req.body);

    if(!parsed_body.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "parse error", "details": get_parsed_error_message(parsed_body)}).send();

    const user_ids = parsed_body.data?.user_ids;

    if(!user_ids) return res.status(HTTP_STATUS.OK).json({message: "No users deleted.", data: {
        requested_count: 0,
        deleted_count: 0,
        deleted_ids: [],
    }}).send();

    try {
        const eligibleUsers = await client.user.findMany({
            where: {
                id: { in: user_ids },
                role: "USER",
                deleted_at: null
            },
            select: { id: true }
        });

        const ids_to_process = eligibleUsers.map(user => user.id);

        if (ids_to_process.length === 0) {
            return res.status(HTTP_STATUS.OK).json({
                message: "No eligible users were found for deletion.",
                data: {
                    requested_count: user_ids.length,
                    deleted_count: 0,
                    deleted_ids: []
                }
            }).send();
        }

        const updateResult = await client.user.updateMany({
            where: {
                id: { in: ids_to_process }
            },
            data: {
                deleted_at: new Date()
            }
        });
        
        // race condition may occur
        // if(updateResult.count !== ids_to_process.length) return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "error in deleting multiple users"}).send();

        return res.status(HTTP_STATUS.OK).json({
            message: "Users deleted.",
            data: {
                requested_count: user_ids.length,
                deleted_count: updateResult.count,
                deleted_ids: ids_to_process
            }
        }).send();

    } catch (error) {
        console.error("Batch Delete Error:", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Internal server error during batch deletion" });
    }
};