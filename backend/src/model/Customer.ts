import crypto from "node:crypto";

import mongoose, { Document, Schema } from "mongoose";

export type RiskBand = "new" | "low" | "medium" | "high";

export interface CustomerRiskSnapshot {
  score: number;
  band: RiskBand;
  suggestedLimit: number;
  reasons: { code: string; params: Record<string, unknown>; impact: -1 | 1 }[];
  updatedAt: Date;
}

export function newStatementToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export interface ICustomer extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  address?: string;

  /** Current outstanding Baki in whole Taka. Kept in sync by the transaction service. */
  totalDue: number;

  lastCreditAt?: Date;
  lastPaymentAt?: Date;

  /** Earliest due date among unpaid credits; unset when nothing is owed. */
  nextDueAt?: Date | null;

  /**
   * Secret for the customer's public statement link (/s/<token>).
   * 192 random bits; rotating it revokes the old link.
   */
  statementToken?: string;

  lastRemindedAt?: Date | null;

  /** Limit set by the shop owner; null = use the suggested limit. */
  creditLimit?: number | null;

  /** Latest risk assessment (refreshed after every transaction). */
  risk?: CustomerRiskSnapshot | null;

  /**
   * Customers are never hard-deleted: their ledger history must survive.
   * Archived customers are hidden from lists and free up their phone number.
   */
  isArchived: boolean;
  archivedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    totalDue: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastCreditAt: Date,

    lastPaymentAt: Date,

    nextDueAt: {
      type: Date,
      default: null,
    },

    statementToken: {
      type: String,
      default: () => newStatementToken(),
    },

    lastRemindedAt: {
      type: Date,
      default: null,
    },

    creditLimit: {
      type: Number,
      min: 0,
      default: null,
    },

    risk: {
      type: new Schema(
        {
          score: Number,
          band: { type: String, enum: ["new", "low", "medium", "high"] },
          suggestedLimit: Number,
          reasons: [{ _id: false, code: String, params: Schema.Types.Mixed, impact: Number }],
          updatedAt: Date,
        },
        { _id: false }
      ),
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedAt: Date,
  },
  {
    timestamps: true,
  }
);

// One active customer per phone number per shop.
customerSchema.index(
  { userId: 1, phone: 1 },
  {
    unique: true,
    partialFilterExpression: { isArchived: false },
    name: "userId_phone_active_unique",
  }
);

// Customer list (newest first) and "who owes the most".
customerSchema.index({ userId: 1, isArchived: 1, createdAt: -1 });
customerSchema.index({ userId: 1, isArchived: 1, totalDue: -1 });
customerSchema.index({ userId: 1, isArchived: 1, nextDueAt: 1 });

customerSchema.index(
  { statementToken: 1 },
  { unique: true, partialFilterExpression: { statementToken: { $type: "string" } } }
);

export const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
