import { z } from "zod";

import { LANGUAGES } from "../model/User.js";
import { bdPhoneSchema, toAsciiDigits } from "./common.validator.js";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name cannot exceed 50 characters");

const shopNameSchema = z
  .string()
  .trim()
  .min(2, "Shop name must be at least 2 characters")
  .max(80, "Shop name cannot exceed 80 characters");

// ------------------------------------------------------------
// Phone + OTP (primary)
// ------------------------------------------------------------

export const otpRequestSchema = z.object({
  phone: bdPhoneSchema,
});

export const otpVerifySchema = z.object({
  phone: bdPhoneSchema,

  code: z
    .string()
    .trim()
    .transform(toAsciiDigits)
    .pipe(z.string().regex(/^\d{6}$/, "Enter the 6-digit code")),

  // Required only when this phone number has no account yet.
  name: nameSchema.optional(),
  shopName: shopNameSchema.optional(),
});

// ------------------------------------------------------------
// Google
// ------------------------------------------------------------

export const googleLoginSchema = z.object({
  credential: z.string().min(20, "Missing Google credential").max(5000),
});

// ------------------------------------------------------------
// Email + password (legacy accounts)
// ------------------------------------------------------------

export const registerSchema = z.object({
  name: nameSchema,

  email: z.string().trim().email("Please provide a valid email"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email"),

  password: z.string().min(1, "Password is required").max(100),
});

// ------------------------------------------------------------
// Profile & settings
// ------------------------------------------------------------

export const updateProfileSchema = z
  .object({
    name: nameSchema,
    shopName: shopNameSchema,
    paymentInfo: z.string().trim().max(120, "Payment info is too long"),
    language: z.enum(LANGUAGES),
    defaultCreditDays: z.number().int().min(1).max(365),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nothing to update",
  });

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
