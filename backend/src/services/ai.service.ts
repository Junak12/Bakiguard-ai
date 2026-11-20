import axios from "axios";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { Customer } from "../model/Customer.js";
import { Transaction } from "../model/Transaction.js";
import { logger } from "../utils/logger.js";
import { getDashboardStats } from "./dashboard.service.js";
import { getAgingReport } from "./ledger.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: env.AI_SERVICE_TIMEOUT_MS,
  headers: env.AI_SERVICE_API_KEY
    ? { "X-API-Key": env.AI_SERVICE_API_KEY }
    : {},
});

interface CustomerActivity {
  _id: mongoose.Types.ObjectId;
  totalCredit: number;
  totalPayment: number;
  creditCount: number;
  paymentCount: number;
  lastPaymentAt: Date | null;
}

/**
 * Builds the per-customer behaviour profile the AI service scores.
 * All heavy lifting happens in MongoDB; Node only joins two small result sets.
 */
async function buildCustomerProfiles(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [customers, activity] = await Promise.all([
    Customer.find(
      { userId: userObjectId, isArchived: false },
      { name: 1, totalDue: 1 }
    ).lean(),

    Transaction.aggregate<CustomerActivity>([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$customerId",
          totalCredit: {
            $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] },
          },
          totalPayment: {
            $sum: { $cond: [{ $eq: ["$type", "PAYMENT"] }, "$amount", 0] },
          },
          creditCount: {
            $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, 1, 0] },
          },
          paymentCount: {
            $sum: { $cond: [{ $eq: ["$type", "PAYMENT"] }, 1, 0] },
          },
          lastPaymentAt: {
            $max: {
              $cond: [{ $eq: ["$type", "PAYMENT"] }, "$createdAt", null],
            },
          },
        },
      },
    ]),
  ]);

  const activityByCustomer = new Map(
    activity.map((entry) => [entry._id.toString(), entry])
  );

  const now = Date.now();

  return customers.map((customer) => {
    const stats = activityByCustomer.get(customer._id.toString());

    return {
      name: customer.name,
      baki: customer.totalDue,
      total_credit: stats?.totalCredit ?? 0,
      total_payment: stats?.totalPayment ?? 0,
      credit_count: stats?.creditCount ?? 0,
      payment_count: stats?.paymentCount ?? 0,
      days_since_payment: stats?.lastPaymentAt
        ? Math.floor((now - new Date(stats.lastPaymentAt).getTime()) / DAY_MS)
        : null,
    };
  });
}

export async function getDashboardAIInsights(userId: string) {
  const [stats, customers, aging] = await Promise.all([
    getDashboardStats(userId),
    buildCustomerProfiles(userId),
    getAgingReport(userId),
  ]);

  const summary = {
    total_customers: stats.totalCustomers,
    total_credit: stats.totalCredit,
    total_payment: stats.totalPayment,
    total_baki: stats.totalBaki,
    total_overdue: aging.totalOverdue,
    overdue_customers: aging.overdueCustomers,
  };

  try {
    const response = await aiClient.post("/api/ai/dashboard-insights", {
      ...summary,
      customers,
    });

    return { ...response.data.data, available: true };
  } catch (error) {
    // The dashboard must keep working when the AI service is down or slow.
    logger.warn(
      { err: axios.isAxiosError(error) ? error.message : error },
      "AI service unavailable; returning summary without insights"
    );

    return { insights: [], summary, available: false };
  }
}
