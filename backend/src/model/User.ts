import mongoose, { Schema, type Document } from "mongoose";

export const LANGUAGES = ["bn", "en"] as const;

export type Language = (typeof LANGUAGES)[number];

export interface IUser extends Document {
  name: string;

  /** Primary login: Bangladeshi mobile number, 01XXXXXXXXX. */
  phone?: string;

  /** Legacy login for accounts created before phone OTP. */
  email?: string;
  password?: string;

  /** Shown to customers in reminders and statements. */
  shopName?: string;

  language: Language;

  /** Days until a new credit is due, unless a due date is given. */
  defaultCreditDays: number;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    // Never returned by queries unless explicitly requested with .select("+password").
    password: {
      type: String,
      select: false,
    },

    shopName: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    language: {
      type: String,
      enum: LANGUAGES,
      default: "bn",
    },

    defaultCreditDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
    },
  },
  {
    timestamps: true,
  }
);

// Unique only where present: phone-only users have no email and vice versa.
userSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);

export const User = mongoose.model<IUser>("User", userSchema);
