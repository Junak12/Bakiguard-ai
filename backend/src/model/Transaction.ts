import mongoose, {
  Document,
  Schema,
} from "mongoose";

export type TransactionType =
  | "CREDIT"
  | "PAYMENT";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;

  type: TransactionType;

  amount: number;

  description?: string;

  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema =
  new Schema<ITransaction>(
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
    },
    {
      timestamps: true,
    }
  );

export const Transaction =
  mongoose.model<ITransaction>(
    "Transaction",
    transactionSchema
  );