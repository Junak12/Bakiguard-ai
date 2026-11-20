import axios from "axios";
import mongoose from "mongoose";

import { Customer, type CustomerRiskSnapshot, type RiskBand } from "../model/Customer.js";
import { Transaction } from "../model/Transaction.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { aiClient } from "./ai.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Paid within this many days after the due date still counts as on time. */
const GRACE_DAYS = 2;

/** Credit limit offered to customers without enough history. */
export const STARTER_LIMIT = 2000;

interface RiskFeatures {
  id: string;
  total_due: number;
  overdue_amount: number;
  days_late_now: number;
  credit_count: number;
  settled_count: number;
  settled_on_time_count: number;
  avg_days_late_settled: number;
  total_credit: number;
  total_paid: number;
  days_since_last_payment: number | null;
  tenure_days: number;
}

interface AiRiskResult {
  id: string;
  score: number;
  band: RiskBand;
  suggested_limit: number;
  reasons: CustomerRiskSnapshot["reasons"];
}

/** Payment-behaviour features for each customer, computed in one aggregation. */
async function buildFeatures(userId: string, customerIds?: string[]) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  const customerFilter: Record<string, unknown> = { userId: userObjectId, isArchived: false };
  if (customerIds) {
    customerFilter._id = { $in: customerIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  const customers = await Customer.find(customerFilter, { totalDue: 1, createdAt: 1 }).lean();

  if (customers.length === 0) return [];

  const isCredit = { $eq: ["$type", "CREDIT"] };
  const isPayment = { $eq: ["$type", "PAYMENT"] };
  const isSettled = { $and: [isCredit, { $eq: ["$outstanding", 0] }, { $gt: ["$settledAt", null] }] };
  const isOverdue = { $and: [isCredit, { $gt: ["$outstanding", 0] }, { $lt: ["$dueDate", now] }] };

  const rows = await Transaction.aggregate<{
    _id: mongoose.Types.ObjectId;
    creditCount: number;
    totalCredit: number;
    totalPaid: number;
    lastPaymentAt: Date | null;
    firstAt: Date;
    settledCount: number;
    onTimeCount: number;
    lateDaysSum: number;
    overdueAmount: number;
    oldestOverdueDue: Date | null;
  }>([
    { $match: { userId: userObjectId, customerId: { $in: customers.map((c) => c._id) } } },
    {
      $group: {
        _id: "$customerId",
        creditCount: { $sum: { $cond: [isCredit, 1, 0] } },
        totalCredit: { $sum: { $cond: [isCredit, "$amount", 0] } },
        totalPaid: { $sum: { $cond: [isPayment, "$amount", 0] } },
        lastPaymentAt: { $max: { $cond: [isPayment, "$createdAt", null] } },
        firstAt: { $min: "$createdAt" },
        settledCount: { $sum: { $cond: [isSettled, 1, 0] } },
        onTimeCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  isSettled,
                  { $lte: ["$settledAt", { $add: ["$dueDate", GRACE_DAYS * DAY_MS] }] },
                ],
              },
              1,
              0,
            ],
          },
        },
        lateDaysSum: {
          $sum: {
            $cond: [
              isSettled,
              { $max: [0, { $dateDiff: { startDate: "$dueDate", endDate: "$settledAt", unit: "day" } }] },
              0,
            ],
          },
        },
        overdueAmount: { $sum: { $cond: [isOverdue, "$outstanding", 0] } },
        oldestOverdueDue: { $min: { $cond: [isOverdue, "$dueDate", null] } },
      },
    },
  ]);

  const byCustomer = new Map(rows.map((row) => [row._id.toString(), row]));
  const nowMs = now.getTime();
  const days = (from: Date) => Math.max(0, Math.floor((nowMs - new Date(from).getTime()) / DAY_MS));

  return customers.map((customer): RiskFeatures => {
    const row = byCustomer.get(customer._id.toString());

    return {
      id: customer._id.toString(),
      total_due: customer.totalDue,
      overdue_amount: row?.overdueAmount ?? 0,
      days_late_now: row?.oldestOverdueDue ? Math.max(1, days(row.oldestOverdueDue)) : 0,
      credit_count: row?.creditCount ?? 0,
      settled_count: row?.settledCount ?? 0,
      settled_on_time_count: row?.onTimeCount ?? 0,
      avg_days_late_settled: row && row.settledCount > 0 ? row.lateDaysSum / row.settledCount : 0,
      total_credit: row?.totalCredit ?? 0,
      total_paid: row?.totalPaid ?? 0,
      days_since_last_payment: row?.lastPaymentAt ? days(row.lastPaymentAt) : null,
      tenure_days: days(row?.firstAt ?? customer.createdAt),
    };
  });
}

/**
 * Scores customers with the AI service and stores the result on each customer.
 * Throws 503 if the AI service can't be reached.
 */
export async function refreshRisk(userId: string, customerIds?: string[]) {
  const features = await buildFeatures(userId, customerIds);

  if (features.length === 0) return new Map<string, CustomerRiskSnapshot>();

  let results: AiRiskResult[];

  try {
    const response = await aiClient.post<{ data: AiRiskResult[] }>("/api/ai/risk", {
      customers: features,
      starter_limit: STARTER_LIMIT,
    });
    results = response.data.data;
  } catch (error) {
    logger.warn(
      { err: axios.isAxiosError(error) ? error.message : error },
      "AI service unavailable for risk scoring"
    );
    throw AppError.unavailable("Risk scoring is unavailable right now.", "AI_UNAVAILABLE");
  }

  const updatedAt = new Date();
  const snapshots = new Map<string, CustomerRiskSnapshot>(
    results.map((result) => [
      result.id,
      {
        score: result.score,
        band: result.band,
        suggestedLimit: result.suggested_limit,
        reasons: result.reasons,
        updatedAt,
      },
    ])
  );

  await Customer.bulkWrite(
    [...snapshots].map(([id, risk]) => ({
      updateOne: { filter: { _id: id, userId }, update: { $set: { risk } } },
    }))
  );

  return snapshots;
}

/** Re-scores in the background after a transaction; never fails the request. */
export function refreshRiskInBackground(userId: string, customerId: string) {
  refreshRisk(userId, [customerId]).catch(() => undefined);
}

function effectiveLimit(creditLimit: number | null | undefined, risk: CustomerRiskSnapshot | undefined) {
  return creditLimit ?? risk?.suggestedLimit ?? null;
}

/** One customer's fresh risk, with the owner's limit and the limit in force. */
export async function getCustomerRisk(userId: string, customerId: string) {
  const customer = await Customer.findOne(
    { _id: customerId, userId, isArchived: false },
    { creditLimit: 1 }
  ).lean();

  if (!customer) throw AppError.notFound("Customer not found");

  const risk = (await refreshRisk(userId, [customerId])).get(customerId);

  return {
    risk: risk ?? null,
    creditLimit: customer.creditLimit ?? null,
    effectiveLimit: effectiveLimit(customer.creditLimit, risk),
  };
}

const BAND_ORDER: Record<RiskBand, number> = { high: 0, medium: 1, new: 2, low: 3 };

/** Every active customer with any history, riskiest first. */
export async function getRiskOverview(userId: string) {
  const snapshots = await refreshRisk(userId);

  const customers = await Customer.find(
    { userId, isArchived: false, _id: { $in: [...snapshots.keys()] } },
    { name: 1, phone: 1, totalDue: 1, creditLimit: 1 }
  ).lean();

  const items = customers
    .map((customer) => {
      const risk = snapshots.get(customer._id.toString())!;
      return {
        customer: {
          _id: customer._id.toString(),
          name: customer.name,
          phone: customer.phone,
          totalDue: customer.totalDue,
          creditLimit: customer.creditLimit ?? null,
        },
        risk,
        effectiveLimit: effectiveLimit(customer.creditLimit, risk),
      };
    })
    .sort(
      (a, b) =>
        BAND_ORDER[a.risk.band] - BAND_ORDER[b.risk.band] ||
        a.risk.score - b.risk.score ||
        b.customer.totalDue - a.customer.totalDue
    );

  const summary = { high: 0, medium: 0, new: 0, low: 0 } as Record<RiskBand, number>;
  items.forEach((item) => (summary[item.risk.band] += 1));

  return { items, summary };
}
