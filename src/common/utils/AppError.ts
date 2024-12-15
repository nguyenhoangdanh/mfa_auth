import { HttpStatusCode } from "../../config/http.config";
import { ErrorCode } from "../enums/error-code.enum";



export class AppError extends Error {
    public readonly statusCode: HttpStatusCode;
    public readonly errorCode: ErrorCode;

    constructor(message: string, statusCode: HttpStatusCode, errorCode: ErrorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}