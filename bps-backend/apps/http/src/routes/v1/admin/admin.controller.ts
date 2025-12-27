import { NextFunction, Request, Response } from "express";
import { BatchUserDeletionSchema } from "../../../types/index.js";
import { HTTP_STATUS } from "../../../config.js";
import { get_parsed_error_message } from "../utils/helper.js";
import { parse } from "dotenv";
import { client } from "@repo/db";

// 2 database operations, but not very slow!
export const batch_delete = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = BatchUserDeletionSchema.safeParse(req.body);

    if(!parsed_body.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "parse error", "details": get_parsed_error_message(parsed_body)}).end();

    const userIds = parsed_body.data?.userIds;

    if(!userIds) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "no user IDs found in body"}).end();

    try {
        const eligibleUsers = await client.user.findMany({
            where: {
                id: { in: userIds },
                role: "USER",
                deleted_at: null
            },
            select: { id: true }
        });

        const idsToProcess = eligibleUsers.map(user => user.id);

        if (idsToProcess.length === 0) {
            return res.status(HTTP_STATUS.OK).json({
                message: "No eligible users were found for deletion.",
                deletedCount: 0,
                deletedIds: []
            }).end();
        }

        const updateResult = await client.user.updateMany({
            where: {
                id: { in: idsToProcess }
            },
            data: {
                deleted_at: new Date()
            }
        });
        
        // race condition may occur
        // if(updateResult.count !== idsToProcess.length) return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({"error": "error in deleting multiple users"}).end();

        return res.status(HTTP_STATUS.OK).json({
            message: "Batch deletion successful",
            requestedCount: userIds.length,
            deletedCount: updateResult.count,
            deletedIds: idsToProcess
        }).end();

    } catch (error) {
        console.error("Batch Delete Error:", error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Internal server error during batch deletion" });
    }
};