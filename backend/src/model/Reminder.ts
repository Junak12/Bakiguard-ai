import mongoose, { Schema, type Document } from "mongoose";

export const REMINDER_CHANNELS = ["whatsapp", "sms", "call"] as const;

export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];

/** A payment reminder the shop owner sent (from their own WhatsApp/SMS/phone). */
export interface IReminder extends Document {
  userId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  channel: ReminderChannel;
  /** Customer's Baki when the reminder was sent. */
  amount: number;
  createdAt: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    channel: { type: String, enum: REMINDER_CHANNELS, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reminderSchema.index({ userId: 1, customerId: 1, createdAt: -1 });
reminderSchema.index({ userId: 1, createdAt: -1 });

export const Reminder = mongoose.model<IReminder>("Reminder", reminderSchema);
