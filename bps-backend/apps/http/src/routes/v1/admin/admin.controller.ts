import { NextFunction, Request, Response } from "express";
import { BatchUserDeletionSchema } from "../../../types/index.js";
import { HTTP_STATUS } from "../../../config.js";
import { get_parsed_error_message } from "../utils/helper.js";
import { parse } from "dotenv";

export const batch_delete = (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = BatchUserDeletionSchema.safeParse(req.body);

    if(!parsed_body) return res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "parse error", "details": get_parsed_error_message(parsed_body)});

    
};