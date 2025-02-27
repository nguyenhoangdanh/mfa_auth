import { UserDocument } from "../database/models/user.model";
import { Request } from "express";

declare global {
    namespace Express {
        interface User extends UserDocument {}
        interface Request {
            sessionId?: string;
            user?: UserDocument;
        }
    }
}

export {}; // This is needed to prevent TS from throwing an error when using the file as a module