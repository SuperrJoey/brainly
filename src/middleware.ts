import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config.js";

export const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
    
    const token = req.cookies.token;
    
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_PASSWORD) as { id: string };
        //@ts-ignore
        req.userId = decoded.id
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token" })
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