import { user } from '@nextui-org/react';
import { userAgent } from 'next/server';
import * as zod from 'zod';


export const emailSchema = zod.string().trim().email().min(5).max(255);
export const passwordSchema = zod.string().trim().min(6).max(255);
export const verificationCodeSchema = zod.string().trim().min(6).max(25);

export const registerSchema = zod.object({
    username: zod.string().trim().min(3).max(255),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    userAgent: zod.string().optional(),
})
.refine(val => val.password === val.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export const loginSchema = zod.object({
    email: emailSchema,
    password: passwordSchema,
    userAgent: zod.string().optional(),
});

export const verificationEmailSchema = zod.object({
    code: verificationCodeSchema,
});

export const resetPasswordSchema = zod.object({
    password: passwordSchema,
    verificationCode: verificationCodeSchema,
});