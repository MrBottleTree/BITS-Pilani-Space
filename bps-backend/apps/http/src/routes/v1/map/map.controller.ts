import { Request, Response, NextFunction } from "express";
import * as Types from "@repo/types";
import { getRejectionReason, HTTP_STATUS } from "@repo/helper";
import { get_parsed_error_message } from "@repo/helper";
import { client } from "@repo/db";

export const add_map = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.AddMapSchema.safeParse(req.body);

    if(!parsed_body.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Parsing error", "details": get_parsed_error_message(parsed_body), reason: await getRejectionReason()});
        return
    }

    const current_user = req.user;
    if(!current_user){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error":"User not found in the body", reason: await getRejectionReason()});
        return;
    }

    try{
        const map_response = await client.map.create({
            data: {
                name: parsed_body.data.name,
                height: parsed_body.data.height,
                width: parsed_body.data.width,
                thumbnail_key: parsed_body.data.thumbnail_key,

                created_by: { connect: { id: current_user.user_id } },

                default_elements: {
                    create: parsed_body.data.default_elements.map((elem)=>({
                        element: { connect: { id: elem.element_id } },
                        x: elem.x,
                        y: elem.y,
                        scale: elem.scale,
                        rotation: elem.rotation
                    }))
                }
            },

            include: { default_elements: true }
        });

        res.status(HTTP_STATUS.CREATED).json({ message: "Map created.", data: {map: map_response}});
        
    }
    catch {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        return;
    }
};

export const get_map = async (req: Request, res: Response, next: NextFunction) => {
    try{
        const map_id = req.params.id;
        if(!map_id) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({ reason: await getRejectionReason() });
            return;
        }

        const response = await client.map.findUnique({where: {id: map_id}});
        return res.status(HTTP_STATUS.OK).json({message: "ok", data: {map: response}});
    }
    catch{
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
    }
};