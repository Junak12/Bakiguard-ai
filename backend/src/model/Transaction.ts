import mongoose, { Document, Schema } from "mongoose";

export type TransactionType = "CREDIT" | "PAYMENT";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  description?: string;
  transactionDate: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["CREDIT", "PAYMENT"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({
  userId: 1,
  customerId: 1,
  transactionDate: -1,
});

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  transactionSchema
);