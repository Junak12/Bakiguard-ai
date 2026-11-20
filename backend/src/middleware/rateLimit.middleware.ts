import { rateLimit } from "express-rate-limit";

import { env } from "../config/env.js";

const rateLimitResponse = (message: string) => ({
  success: false,
  message,
  code: "RATE_LIMITED",
});

/** Broad protection for the whole API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.isTest,
  message: rateLimitResponse("Too many requests. Please slow down."),
});

/** Tight limit on login/register to stop password guessing. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.isTest,
  message: rateLimitResponse(
    "Too many attempts. Please try again in 15 minutes."
  ),
});

/**
 * Per-IP cap on sending login codes: each one costs an SMS.
 * (Per-phone limits are enforced in the OTP service.)
 */
export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.isTest,
  message: rateLimitResponse(
    "Too many codes requested. Please try again later."
  ),
});

/** Public statement links: generous for real customers, hostile to token guessing. */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => env.isTest,
  message: rateLimitResponse("Too many requests. Please try again later."),
});
