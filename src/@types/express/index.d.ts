// src/types/express/index.d.ts

import { UserDocument } from "../../database/models/user.model";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserDocument; // Thêm user vào request nếu sử dụng Passport
    sessionId?: string;
  }
}
