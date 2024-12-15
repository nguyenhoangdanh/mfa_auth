import * as z from 'zod';

export const mfaSchema = z.object({
    code: z.string().trim().min(1).max(6),
    secretKey: z.string().trim().min(1).max(100),
});

export const verifyMfaForLoginSchema = z.object({
    code: z.string().trim().min(1).max(6),
    email: z.string().trim().email().min(5).max(255),
    userAgent: z.string().optional(),
});