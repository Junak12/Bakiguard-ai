import { Router, type NextFunction, type Request, type Response } from "express";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

import {
  getMe,
  login,
  logout,
  refresh,
  register,
  requestOtp,
  updateMe,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authLimiter, otpSendLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

/** Phone login is built but off until an SMS provider is chosen (PHONE_LOGIN_ENABLED). */
function requirePhoneLogin(_req: Request, _res: Response, next: NextFunction) {
  if (!env.PHONE_LOGIN_ENABLED) {
    return next(new AppError(404, "Phone login is not available yet", "PHONE_LOGIN_DISABLED"));
  }
  next();
}

// Phone + OTP (switched off for now)
router.post("/otp/request", requirePhoneLogin, otpSendLimiter, requestOtp);
router.post("/otp/verify", requirePhoneLogin, authLimiter, verifyOtp);

// Email + password (primary)
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

export default router;
