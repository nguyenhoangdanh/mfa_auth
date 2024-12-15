import { ErrorRequestHandler, Response, Request, NextFunction } from "express";
import { HTTPSTATUS } from "../config/http.config";
import * as z from 'zod';
import { clearAuthenticaionCookies, REFRESH_PATH } from "../common/utils/cookie";

const formatError = (res: Response, error: z.ZodError) => {
    const errors = error?.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Validation Failed',
        errors,
    });
};

export const errorHandler: ErrorRequestHandler = (error: any, req: Request, res: Response, next: NextFunction): any => {
    console.error(`Error: occured on PATH: ${req.path} METHOD: ${req.method} `, error);

    if(req.path === REFRESH_PATH) {
        clearAuthenticaionCookies(res);
    }

    if (error instanceof SyntaxError) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: 'Invalid JSON format, please check your request body',
    });
    }
    if(error instanceof z.ZodError) {
        return formatError(res, error);
    }   

    res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
        error: error?.message ?? 'Unknown error occured',
    });
}