import mongoose, { type ClientSession } from "mongoose";

import { Customer } from "../model/Customer.js";
import { Transaction } from "../model/Transaction.js";
import { logger } from "../utils/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const LEGACY_CREDIT_DAYS = 30;

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Applies a payment to the customer's unpaid credits, oldest first.
 * Must run inside the same DB transaction that records the payment.
 */
export async function settleCreditsFifo(
  userId: string,
  customerId: string,
  amount: number,
  session: ClientSession
) {
  let remaining = amount;

  const openCredits = await Transaction.find(
    { userId, customerId, type: "CREDIT", outstanding: { $gt: 0 } },
    { outstanding: 1 },
    { session }
  ).sort({ createdAt: 1, _id: 1 });

  const updates = [];

  for (const credit of openCredits) {
    if (remaining <= 0) break;

    const applied = Math.min(credit.outstanding ?? 0, remaining);
    remaining -= applied;

    updates.push({
      updateOne: {
        filter: { _id: credit._id },
        update: { $inc: { outstanding: -applied } },
      },
    });
  }

  if (updates.length > 0) {
    await Transaction.bulkWrite(updates, { session });
  }
}

/** Sets customer.nextDueAt to the earliest due date among unpaid credits. */
export async function refreshNextDue(
  userId: string,
  customerId: string,
  session?: ClientSession
) {
  const [earliest] = await Transaction.find(
    { userId, customerId, type: "CREDIT", outstanding: { $gt: 0 } },
    { dueDate: 1 },
    { session }
  )
    .sort({ dueDate: 1 })
    .limit(1)
    .lean();

  await Customer.updateOne(
    { _id: customerId, userId },
    { $set: { nextDueAt: earliest?.dueDate ?? null } },
    { session }
  );
}

/**
 * One-time conversion of ledgers recorded before due dates existed:
 * replays each affected customer's history to work out what is still unpaid.
 * Idempotent: only customers with credits missing `outstanding` are touched.
 */
export async function backfillLedgers() {
  const pending = await Transaction.aggregate<{
    _id: { userId: mongoose.Types.ObjectId; customerId: mongoose.Types.ObjectId };
  }>([
    { $match: { type: "CREDIT", outstanding: { $exists: false } } },
    { $group: { _id: { userId: "$userId", customerId: "$customerId" } } },
  ]);

  for (const { _id } of pending) {
    const history = await Transaction.find(
      { userId: _id.userId, customerId: _id.customerId },
      { type: 1, amount: 1, createdAt: 1, dueDate: 1 }
    )
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    const open: { id: mongoose.Types.ObjectId; outstanding: number }[] = [];
    const finalOutstanding = new Map<string, number>();

    for (const entry of history) {
      if (entry.type === "CREDIT") {
        open.push({ id: entry._id, outstanding: entry.amount });
        continue;
      }

      let remaining = entry.amount;

      for (const credit of open) {
        if (remaining <= 0) break;
        const applied = Math.min(credit.outstanding, remaining);
        credit.outstanding -= applied;
        remaining -= applied;
      }
    }

    for (const credit of open) {
      finalOutstanding.set(credit.id.toString(), credit.outstanding);
    }

    await Transaction.bulkWrite(
      history
        .filter((entry) => entry.type === "CREDIT")
        .map((entry) => ({
          updateOne: {
            filter: { _id: entry._id },
            update: {
              $set: {
                outstanding: finalOutstanding.get(entry._id.toString()) ?? 0,
                dueDate: entry.dueDate ?? addDays(entry.createdAt, LEGACY_CREDIT_DAYS),
              },
            },
          },
        }))
    );

    await refreshNextDue(String(_id.userId), String(_id.customerId));
  }

  if (pending.length > 0) {
    logger.info({ customers: pending.length }, "Backfilled credit due dates and balances");
  }
}

// ============================================================
// AGING
// ============================================================

export const AGING_BUCKETS = ["notDue", "d1_30", "d31_60", "d61_90", "d90plus"] as const;

export type AgingBucket = (typeof AGING_BUCKETS)[number];

export interface AgingReport {
  asOf: string;
  totalOutstanding: number;
  totalOverdue: number;
  overdueCustomers: number;
  buckets: Record<AgingBucket, { amount: number; customers: number }>;
}

/**
 * Splits unpaid money by how late it is:
 * not yet due, 1–30, 31–60, 61–90 and 90+ days overdue.
 * A customer is counted in every bucket they have money in.
 */
export async function getAgingReport(
  userId: string,
  customerId?: string
): Promise<AgingReport> {
  const now = new Date();

  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    type: "CREDIT",
    outstanding: { $gt: 0 },
  };

  if (customerId) {
    match.customerId = new mongoose.Types.ObjectId(customerId);
  }

  const rows = await Transaction.aggregate<{
    _id: AgingBucket;
    amount: number;
    customers: mongoose.Types.ObjectId[];
  }>([
    { $match: match },
    {
      $addFields: {
        daysOverdue: {
          $dateDiff: { startDate: "$dueDate", endDate: now, unit: "day" },
        },
      },
    },
    {
      $addFields: {
        bucket: {
          $switch: {
            branches: [
              { case: { $lte: ["$daysOverdue", 0] }, then: "notDue" },
              { case: { $lte: ["$daysOverdue", 30] }, then: "d1_30" },
              { case: { $lte: ["$daysOverdue", 60] }, then: "d31_60" },
              { case: { $lte: ["$daysOverdue", 90] }, then: "d61_90" },
            ],
            default: "d90plus",
          },
        },
      },
    },
    {
      $group: {
        _id: "$bucket",
        amount: { $sum: "$outstanding" },
        customers: { $addToSet: "$customerId" },
      },
    },
  ]);

  const buckets = Object.fromEntries(
    AGING_BUCKETS.map((bucket) => [bucket, { amount: 0, customers: 0 }])
  ) as AgingReport["buckets"];

  const overdueCustomerIds = new Set<string>();
  let totalOutstanding = 0;
  let totalOverdue = 0;

  for (const row of rows) {
    buckets[row._id] = { amount: row.amount, customers: row.customers.length };
    totalOutstanding += row.amount;

    if (row._id !== "notDue") {
      totalOverdue += row.amount;
      row.customers.forEach((id) => overdueCustomerIds.add(id.toString()));
    }
  }

  return {
    asOf: now.toISOString(),
    totalOutstanding,
    totalOverdue,
    overdueCustomers: overdueCustomerIds.size,
    buckets,
  };
}

/**
 * Per customer: money past its due date and the oldest such due date.
 * Optionally limited to some customers.
 */
export async function getOverdueByCustomer(userId: string, customerIds?: string[]) {
  const match: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
    type: "CREDIT",
    outstanding: { $gt: 0 },
    dueDate: { $lt: new Date() },
  };

  if (customerIds) {
    match.customerId = { $in: customerIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  const rows = await Transaction.aggregate<{
    _id: mongoose.Types.ObjectId;
    overdueAmount: number;
    oldestDueDate: Date;
  }>([
    { $match: match },
    {
      $group: {
        _id: "$customerId",
        overdueAmount: { $sum: "$outstanding" },
        oldestDueDate: { $min: "$dueDate" },
      },
    },
  ]);

  return new Map(rows.map((row) => [row._id.toString(), row]));
}
