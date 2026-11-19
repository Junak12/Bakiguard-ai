import crypto from "node:crypto";

import { env } from "../config/env.js";
import { Otp } from "../model/Otp.js";
import { AppError } from "../utils/AppError.js";
import { sendSms } from "./sms/sms.service.js";

export const OTP_LENGTH = 6;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_VERIFY_ATTEMPTS = 5;

const HOUR_MS = 60 * 60 * 1000;

function hashCode(phone: string, code: string) {
  // Bound to the phone number so a hash can't be replayed for another number.
  return crypto
    .createHmac("sha256", env.JWT_SECRET)
    .update(`otp:${phone}:${code}`)
    .digest("hex");
}

function generateCode() {
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

function toBanglaDigits(value: string) {
  return value.replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

/** Sends a fresh login code, enforcing cooldown and hourly limits. */
export async function sendOtp(phone: string) {
  const now = new Date();
  const existing = await Otp.findOne({ phone });

  if (existing) {
    const secondsSinceLast = (now.getTime() - existing.lastSentAt.getTime()) / 1000;

    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      throw new AppError(
        429,
        "Please wait a moment before requesting another code.",
        "OTP_COOLDOWN",
        { retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast) }
      );
    }

    const windowActive = now.getTime() - existing.windowStartedAt.getTime() < HOUR_MS;

    if (windowActive && existing.sendsInWindow >= MAX_SENDS_PER_HOUR) {
      throw new AppError(
        429,
        "Too many codes requested for this number. Please try again in an hour.",
        "OTP_LIMIT"
      );
    }
  }

  const code = generateCode();
  const windowActive =
    existing && now.getTime() - existing.windowStartedAt.getTime() < HOUR_MS;

  await Otp.findOneAndUpdate(
    { phone },
    {
      $set: {
        codeHash: hashCode(phone, code),
        expiresAt: new Date(now.getTime() + env.OTP_TTL_MINUTES * 60 * 1000),
        attempts: 0,
        lastSentAt: now,
        windowStartedAt: windowActive ? existing!.windowStartedAt : now,
        sendsInWindow: windowActive ? existing!.sendsInWindow + 1 : 1,
      },
    },
    { upsert: true }
  );

  await sendSms(
    phone,
    `BakiGuard কোড: ${toBanglaDigits(code)} (${code})। ` +
      `${toBanglaDigits(String(env.OTP_TTL_MINUTES))} মিনিটের মধ্যে ব্যবহার করুন। কাউকে বলবেন না।`
  );

  return {
    expiresInSeconds: env.OTP_TTL_MINUTES * 60,
    resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
  };
}

/**
 * Checks a code. A correct code is consumed (single use).
 * Wrong guesses are counted; after MAX_VERIFY_ATTEMPTS the code is dead.
 */
export async function verifyOtp(phone: string, code: string) {
  const invalid = () =>
    AppError.badRequest("The code is incorrect or has expired.", "OTP_INVALID");

  // Count the attempt atomically before comparing, so parallel guesses can't
  // exceed the limit.
  const otp = await Otp.findOneAndUpdate(
    {
      phone,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: MAX_VERIFY_ATTEMPTS },
    },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" }
  );

  if (!otp) {
    throw invalid();
  }

  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hashCode(phone, code), "hex");

  if (!crypto.timingSafeEqual(expected, actual)) {
    throw invalid();
  }

  // Consume the code but keep the send-limit counters.
  await Otp.updateOne(
    { _id: otp._id },
    { $set: { expiresAt: new Date(0), attempts: MAX_VERIFY_ATTEMPTS } }
  );
}
