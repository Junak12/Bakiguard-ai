import { Router } from "express";

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

// Phone + OTP (primary)
router.post("/otp/request", otpSendLimiter, requestOtp);
router.post("/otp/verify", authLimiter, verifyOtp);

// Email + password (legacy accounts)
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.patch("/me", authenticate, updateMe);

export default router;
