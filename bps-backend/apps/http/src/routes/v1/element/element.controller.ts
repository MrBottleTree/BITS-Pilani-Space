import { Request, Response, NextFunction } from "express";
import * as Types from "../../../types/index.js";
import { HTTP_STATUS } from "../../../config.js";
import { get_parsed_error_message } from "../utils/helper.js";
import { client } from "@repo/db";

export const add_element = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.AddElementSchema.safeParse(req.body);

    if(!parsed_body.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Failed to parse the body", "details": get_parsed_error_message(parsed_body)});
        return
    }

    const current_user = req.user;
    if(!current_user) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "User not found in body"});
        return;
    }

    try{
        const db_resp = await client.element.create({
            data: {
                name: parsed_body.data.name,
                image_key: parsed_body.data.image_key,
                static: parsed_body.data.static,
                height: parsed_body.data.height,
                width: parsed_body.data.width,
                created_by: {
                    connect: { id: current_user.user_id }
                }
            },
            select: { id: true, name: true, image_key: true, height: true, width: true, static: true, updated_at: true }
        });

        if(!db_resp){
            res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
            return;
        }

        res.status(HTTP_STATUS.CREATED).json({message: "Element created.", data: {element: db_resp}});
    }
    catch {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        return;
    }
};

export const get_all_elements = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const db_resp = await client.element.findMany({
            where: {
                deleted_at: null
            },
            select: {
                id: true,
                name: true,
                image_key: true,
                static: true
            }
        });

        res.status(HTTP_STATUS.OK).json({message: "ok", data: {elements: db_resp}});
    }
    catch{
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        return;
    }
};