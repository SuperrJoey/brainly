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

    if (typeof header !== 'string') {
        res.status(401).json({
            message: "Invalid authorization header format"
        });
        return;
    }

    const decoded = jwt.verify(header as string, JWT_PASSWORD)
    if(decoded) {
        //@ts-ignore
        req.userId = decoded.id;
        next();
    } else {
        res.status(403).json({
            message: "not logged in"
        })
    }

}

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