import mongoose from "mongoose";

import { env } from "../config/env.js";
import { PLANS, type PlanId } from "../config/plans.js";
import { Customer } from "../model/Customer.js";
import { Payment } from "../model/Payment.js";
import { User } from "../model/User.js";
import { AppError } from "../utils/AppError.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Short code the owner writes as the bKash payment reference. */
export function shopCode(userId: string) {
  return `BG${userId.slice(-6).toUpperCase()}`;
}

/** Pro only while paid up; lapses to Free automatically. */
export function activePlan(user: { plan?: string; planExpiresAt?: Date | null }): PlanId {
  return user.plan === "pro" && user.planExpiresAt && user.planExpiresAt.getTime() > Date.now()
    ? "pro"
    : "free";
}

async function loadShop(userId: string) {
  const user = await User.findById(userId, { plan: 1, planExpiresAt: 1 }).lean();
  if (!user) throw AppError.notFound("User not found");
  return user;
}

export async function getPlanFor(userId: string) {
  const user = await loadShop(userId);
  return { id: activePlan(user), limits: PLANS[activePlan(user)], expiresAt: user.planExpiresAt ?? null };
}

function planRequired(message: string) {
  return new AppError(402, message, "PLAN_REQUIRED");
}

/** Free plan: refuse a new customer once the limit is reached. */
export async function assertCanAddCustomer(userId: string) {
  const { limits } = await getPlanFor(userId);

  if (limits.maxCustomers === null) return;

  const count = await Customer.countDocuments({ userId, isArchived: false });

  if (count >= limits.maxCustomers) {
    throw new AppError(
      402,
      `The Free plan allows ${limits.maxCustomers} customers. Upgrade to Pro for unlimited customers.`,
      "PLAN_LIMIT_CUSTOMERS",
      { limit: limits.maxCustomers }
    );
  }
}

export async function assertReportExport(userId: string) {
  const { limits } = await getPlanFor(userId);
  if (!limits.reportExport) throw planRequired("Report export is a Pro feature.");
}

export async function assertStaffAllowed(userId: string, currentStaff: number) {
  const { limits } = await getPlanFor(userId);

  if (currentStaff >= limits.maxStaff) {
    throw new AppError(
      402,
      limits.maxStaff === 0
        ? "Staff accounts are a Pro feature."
        : `Your plan allows ${limits.maxStaff} staff members.`,
      "PLAN_LIMIT_STAFF",
      { limit: limits.maxStaff }
    );
  }
}

/** Everything the Billing page shows. */
export async function getBilling(userId: string, staffCount: number) {
  const plan = await getPlanFor(userId);

  const [customers, pending, history] = await Promise.all([
    Customer.countDocuments({ userId, isArchived: false }),
    Payment.findOne({ userId, status: "pending" }, { trxId: 1, amount: 1, createdAt: 1 }).lean(),
    Payment.find({ userId }, { trxId: 1, amount: 1, status: 1, createdAt: 1, reviewedAt: 1, note: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return {
    plan: plan.id,
    expiresAt: plan.expiresAt,
    limits: plan.limits,
    usage: { customers, staff: staffCount },
    plans: PLANS,
    payTo: {
      method: "bkash",
      number: env.BILLING_BKASH_NUMBER || null,
      amount: PLANS.pro.priceBdt,
      reference: shopCode(userId),
    },
    pendingPayment: pending,
    payments: history,
  };
}

/** Owner reports a bKash payment; an admin confirms it against the bKash statement. */
export async function submitPayment(userId: string, input: { trxId: string; senderNumber: string }) {
  const pending = await Payment.exists({ userId, status: "pending" });

  if (pending) {
    throw AppError.conflict("You already have a payment waiting for confirmation.", "PAYMENT_PENDING");
  }

  try {
    return await Payment.create({
      userId,
      plan: "pro",
      amount: PLANS.pro.priceBdt,
      senderNumber: input.senderNumber,
      trxId: input.trxId,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw AppError.conflict("This bKash transaction ID was already used.", "TRX_ID_USED");
    }
    throw error;
  }
}

// ============================================================
// ADMIN
// ============================================================

export async function listPayments(status: "pending" | "approved" | "rejected") {
  return Payment.find({ status })
    .sort({ createdAt: 1 })
    .limit(200)
    .populate<{ userId: { name: string; email?: string; shopName?: string } }>({
      path: "userId",
      select: "name email shopName",
    })
    .lean();
}

/** Approves once (atomic) and extends Pro by one period from today or the current expiry. */
export async function approvePayment(paymentId: string) {
  if (!mongoose.isValidObjectId(paymentId)) throw AppError.badRequest("Invalid payment id");

  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: "pending" },
    { $set: { status: "approved", reviewedAt: new Date() } },
    { returnDocument: "after" }
  ).lean();

  if (!payment) throw AppError.notFound("No pending payment with this id");

  const user = await loadShop(String(payment.userId));
  const from = Math.max(Date.now(), user.planExpiresAt?.getTime() ?? 0);

  await User.updateOne(
    { _id: payment.userId },
    { $set: { plan: "pro", planExpiresAt: new Date(from + PLANS.pro.periodDays * DAY_MS) } }
  );

  return payment;
}

export async function rejectPayment(paymentId: string, note?: string) {
  if (!mongoose.isValidObjectId(paymentId)) throw AppError.badRequest("Invalid payment id");

  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: "pending" },
    { $set: { status: "rejected", reviewedAt: new Date(), note } },
    { returnDocument: "after" }
  ).lean();

  if (!payment) throw AppError.notFound("No pending payment with this id");

  return payment;
}
