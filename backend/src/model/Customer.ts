import mongoose, { Document, Schema } from "mongoose";

export interface ICustomer extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  address?: string;
  totalDue: number;
}

const customerSchema = new Schema<ICustomer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate phone numbers for the same user
customerSchema.index(
  { userId: 1, phone: 1 },
  { unique: true }
);

export const Customer = mongoose.model<ICustomer>(
  "Customer",
  customerSchema
);