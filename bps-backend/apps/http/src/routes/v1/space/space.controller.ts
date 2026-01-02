import { NextFunction, Request, Response } from "express";
import * as Types from "../../../types/index.js";
import { ERROR_DATABASE_CONNECT_FOREIGN, HTTP_STATUS } from "../../../config.js";
import { get_parsed_error_message } from "../utils/helper.js";
import { client } from "@repo/db";

export const add_space = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.AddSpaceSchema.safeParse(req.body);
    if(!parsed_body.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Error parsing the body", "details": get_parsed_error_message(parsed_body)});
        return
    }

    try {
        const map_id = parsed_body.data.map_id;
        const name = parsed_body.data.name;

        const check_map = await client.map.findUnique({
            where: {id: map_id, deleted_at: null},
            select: { id: true },
        });

        if(!check_map){
            res.status(HTTP_STATUS.BAD_REQUEST).json({error: "Map deleted."});
            return;
        }

        const db_response = await client.space.create({
            data: {
                name: name,
                map: { connect: {id: map_id} }
            },
            select: {
                id: true,
                created_at: true,
                updated_at: true,
                map: {
                    select: {
                        id: true,
                        name: true,
                        height: true,
                        width: true,
                        thumbnail_key: true,
                        updated_at: true,
                        default_elements: {
                            select: {
                                id: true,
                                x: true,
                                y: true,
                                scale: true,
                                rotation: true,
                                element: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image_key: true,
                                        height: true,
                                        width: true,
                                        static: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if(!db_response) return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);

        res.status(HTTP_STATUS.CREATED).json({message:'Space created.', data: { space: db_response }});
    }
    catch(err: any){
        if(err.code == ERROR_DATABASE_CONNECT_FOREIGN){
            res.status(HTTP_STATUS.BAD_REQUEST).json({error: "Invalid map id."});
            return;
        }

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
};

export const add_element_to_space = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.AddElementToSpaceSchema.safeParse(req.body);
    if(!parsed_body.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Error parsing the body", "details": get_parsed_error_message(parsed_body)});
        return
    }

    try{
        const space_id = parsed_body.data.space_id;
        const element = parsed_body.data.element;
        const new_placement = await client.spaceElementPlacement.create({
            data: {
                x: element.x,
                y: element.y,
                scale: element.scale,
                rotation: element.rotation,
                space: { connect: { id: space_id } },
                element: { connect: { id: element.element_id } }
            },
            select: {
                id: true,
                x: true,
                y: true,
                scale: true,
                rotation: true,
                space: { select: {id: true} }
            }
        });

        res.status(HTTP_STATUS.CREATED).json({message: "ok", data: {element: new_placement}});
        return;
    }

    catch{
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
    }
};

export const delete_element_from_space = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_body = Types.DeleteElementFromSpaceSchema.safeParse(req.body);
    if(!parsed_body.success){
        res.status(HTTP_STATUS.BAD_REQUEST).json({"error": "Error parsing the body", "details": get_parsed_error_message(parsed_body)});
        return
    }

    try{
        const db_response = await client.spaceElementPlacement.delete({where: {id: parsed_body.data.added_element_id}, select: { id: true }});

        res.status(HTTP_STATUS.OK).json({message: "Element deleted from space.", data: { id: db_response.id }});
        return
    }

    catch{
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send();
        return;
    }
};