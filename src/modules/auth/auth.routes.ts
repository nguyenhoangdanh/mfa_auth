import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJwt } from "../../common/strategies/jwt.strategy";



const authRoutes = Router();

authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);

//Verify email
authRoutes.post("/verify-email", authController.verifyEmail);


//forgot password
authRoutes.post("/forgot-password", authController.forgotPassword);

//reset password
authRoutes.post("/reset-password", authController.resetPassword);

//logout
authRoutes.post("/logout", authenticateJwt, authController.logout);

// Refresh token
authRoutes.get("/refresh-token", authController.refreshToken);

export { authRoutes };