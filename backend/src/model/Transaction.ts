import mongoose, { Document, Schema } from "mongoose";

export const TRANSACTION_TYPES = ["CREDIT", "PAYMENT"] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;

  type: TransactionType;

  /** Whole Taka. */
  amount: number;

  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Amount must be a whole number",
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

// Shop-wide history and per-customer history, both newest first.
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, customerId: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);
