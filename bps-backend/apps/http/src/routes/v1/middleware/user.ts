import { NextFunction, Request, Response } from "express";
import * as Types from "../../../types";
import { HTTP_STATUS, JWT_SECRET } from "../../../config.js";
import jwt from "jsonwebtoken";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const parsed_header = Types.AuthorizationHeaderSchema.safeParse(req.headers);

    if(!parsed_header.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({
        "error": "Bad Request",
        "details": parsed_header.error.format()
    });

    const auth_token = parsed_header.body.authorization;
    try{
        const decoded_auth = jwt.verify(auth_token, JWT_SECRET) as { userId: string, email: string, role: string };
        
        // doing some safety checks here itself to remove the complexity from the controller side
        const parsed_auth = Types.UserScheme.safeParse(decoded_auth)
        if(!parsed_auth.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({
            "error": "Parsing error",
            "details": parsed_auth.error.format()
        });

        req.user = parsed_auth.data;
        next();
    }
    catch (error){
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            "error": "Bad Request",
            "details": error
        });
    }
};

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const parsed_header = Types.AuthorizationHeaderSchema.safeParse(req.headers);

    if(!parsed_header.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({
        "error": "Bad Request",
        "details": parsed_header.error.format()
    });

    const auth_token = parsed_header.body.authorization;
    try{
        const decoded_auth = jwt.verify(auth_token, JWT_SECRET) as { userId: string, email: string, role: string };
        
        if(decoded_auth.role != "ADMIN") return res.status(HTTP_STATUS.UNAUTHORIZED).json({"error": "Unauthorized role"});
        
        // doing some safety checks here itself to remove the complexity from the controller side
        const parsed_auth = Types.UserScheme.safeParse(decoded_auth)
        if(!parsed_auth.success) return res.status(HTTP_STATUS.BAD_REQUEST).json({
            "error": "Parsing error",
            "details": parsed_auth.error.format()
        });

        req.user = parsed_auth.data;
        next();
    }
    catch (error){
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            "error": "Bad Request",
            "details": error
        });
    }
};