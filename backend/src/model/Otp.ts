import mongoose, { Schema, type Document } from "mongoose";

/**
 * One pending login code per phone number.
 * The code itself is never stored, only an HMAC of it.
 */
export interface IOtp extends Document {
  phone: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;

  /** For resend cooldown and hourly send limits. */
  lastSentAt: Date;
  windowStartedAt: Date;
  sendsInWindow: number;
}

const otpSchema = new Schema<IOtp>(
  {
    phone: { type: String, required: true, unique: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    windowStartedAt: { type: Date, required: true },
    sendsInWindow: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Kept for an hour after the last send so hourly limits survive code expiry.
otpSchema.index({ lastSentAt: 1 }, { expireAfterSeconds: 60 * 60 });

export const Otp = mongoose.model<IOtp>("Otp", otpSchema);
