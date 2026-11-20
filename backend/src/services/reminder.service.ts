import { Customer, newStatementToken } from "../model/Customer.js";
import { Reminder, type ReminderChannel } from "../model/Reminder.js";
import { AppError } from "../utils/AppError.js";

/** Records that the owner reminded a customer (sent from their own phone). */
export async function logReminder(userId: string, customerId: string, channel: ReminderChannel) {
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, userId, isArchived: false },
    { $set: { lastRemindedAt: new Date() } },
    { returnDocument: "after" }
  ).lean();

  if (!customer) {
    throw AppError.notFound("Customer not found");
  }

  return Reminder.create({ userId, customerId, channel, amount: customer.totalDue });
}

export async function listReminders(userId: string, customerId: string, limit = 10) {
  const exists = await Customer.exists({ _id: customerId, userId });

  if (!exists) {
    throw AppError.notFound("Customer not found");
  }

  return Reminder.find({ userId, customerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-__v -userId")
    .lean();
}

/** New statement link; the old one stops working immediately. */
export async function rotateStatementToken(userId: string, customerId: string) {
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, userId, isArchived: false },
    { $set: { statementToken: newStatementToken() } },
    { returnDocument: "after" }
  ).lean();

  if (!customer) {
    throw AppError.notFound("Customer not found");
  }

  return { statementToken: customer.statementToken };
}
