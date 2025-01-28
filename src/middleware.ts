import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { JWT_PASSWORD } from "./config.js";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];

    if(!header) {
        res.status(401).json({
            message: "Authorization header missing"
        });
        return;
    }

    const token = header.startsWith("Bearer") 
            ? header.slice(7)
            : header;


    try {
        const decoded = jwt.verify(token, JWT_PASSWORD);

        //@ts-ignore
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(403).json({
            message: "Invalid token"
        });
    }
};

//override the types of the epxress request object
/*
declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}
    */