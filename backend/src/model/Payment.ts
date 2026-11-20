import mongoose, { Schema, type Document } from "mongoose";

export type PaymentStatus = "pending" | "approved" | "rejected";

/**
 * A subscription payment the shop owner reports after sending money by bKash.
 * An admin checks the bKash statement and approves or rejects it.
 * (Replaced by a gateway callback once bKash checkout / SSLCommerz is connected.)
 */
export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  plan: "pro";
  amount: number;
  method: "bkash";
  senderNumber: string;
  trxId: string;
  status: PaymentStatus;
  reviewedAt?: Date;
  note?: string;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["pro"], required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["bkash"], default: "bkash" },
    senderNumber: { type: String, required: true },
    // A bKash transaction id can only be claimed once.
    trxId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedAt: Date,
    note: { type: String, maxlength: 300 },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: 1 });

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
