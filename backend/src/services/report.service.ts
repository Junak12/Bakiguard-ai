import mongoose from "mongoose";

import { Customer } from "../model/Customer.js";
import { Transaction } from "../model/Transaction.js";

/** Bangladesh Standard Time: UTC+6, no daylight saving. */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "2026-11" -> [start, end) as UTC instants for that month in Dhaka time. */
export function monthRange(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);

  const start = new Date(Date.UTC(year, monthIndex - 1, 1) - DHAKA_OFFSET_MS);
  const end = new Date(Date.UTC(year, monthIndex, 1) - DHAKA_OFFSET_MS);

  return { start, end, days: Math.round((end.getTime() - start.getTime()) / DAY_MS) };
}

/** The current month in Dhaka time, "YYYY-MM". */
export function currentMonth() {
  const now = new Date(Date.now() + DHAKA_OFFSET_MS);
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

const sumIf = (type: "CREDIT" | "PAYMENT") => ({
  $sum: { $cond: [{ $eq: ["$type", type] }, "$amount", 0] },
});
const countIf = (type: "CREDIT" | "PAYMENT") => ({
  $sum: { $cond: [{ $eq: ["$type", type] }, 1, 0] },
});

/**
 * Month-end report: what was given, what came back, and where the shop stands.
 * Balances are rebuilt from the ledger, so past months stay correct even after
 * later payments.
 */
export async function getMonthlyReport(userId: string, month: string) {
  const { start, end, days } = monthRange(month);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [before, during, daily, balances, newCustomers] = await Promise.all([
    // Everything before the month: the opening balance.
    Transaction.aggregate<{ credit: number; payment: number }>([
      { $match: { userId: userObjectId, createdAt: { $lt: start } } },
      { $group: { _id: null, credit: sumIf("CREDIT"), payment: sumIf("PAYMENT") } },
    ]),

    Transaction.aggregate<{
      credit: number;
      payment: number;
      creditCount: number;
      paymentCount: number;
    }>([
      { $match: { userId: userObjectId, createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: null,
          credit: sumIf("CREDIT"),
          payment: sumIf("PAYMENT"),
          creditCount: countIf("CREDIT"),
          paymentCount: countIf("PAYMENT"),
        },
      },
    ]),

    // Per Dhaka calendar day.
    Transaction.aggregate<{ _id: string; credit: number; payment: number }>([
      { $match: { userId: userObjectId, createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+06:00" } },
          credit: sumIf("CREDIT"),
          payment: sumIf("PAYMENT"),
        },
      },
    ]),

    // Each customer's balance at the end of the month.
    Transaction.aggregate<{ _id: mongoose.Types.ObjectId; balance: number }>([
      { $match: { userId: userObjectId, createdAt: { $lt: end } } },
      {
        $group: {
          _id: "$customerId",
          balance: {
            $sum: {
              $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", { $multiply: ["$amount", -1] }],
            },
          },
        },
      },
      { $match: { balance: { $gt: 0 } } },
      { $sort: { balance: -1 } },
    ]),

    Customer.countDocuments({ userId: userObjectId, createdAt: { $gte: start, $lt: end } }),
  ]);

  const opening = (before[0]?.credit ?? 0) - (before[0]?.payment ?? 0);
  const given = during[0]?.credit ?? 0;
  const collected = during[0]?.payment ?? 0;
  const closing = opening + given - collected;

  // Share of everything that could have been collected this month that was.
  const collectable = opening + given;
  const collectionRate = collectable > 0 ? Math.round((collected / collectable) * 100) : 0;

  const topIds = balances.slice(0, 10).map((row) => row._id);
  const names = new Map(
    (await Customer.find({ _id: { $in: topIds } }, { name: 1, phone: 1 }).lean()).map((c) => [
      c._id.toString(),
      c,
    ])
  );

  const byDay = new Map(daily.map((row) => [row._id, row]));
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + DHAKA_OFFSET_MS + index * DAY_MS)
      .toISOString()
      .slice(0, 10);
    const row = byDay.get(date);
    return { date, credit: row?.credit ?? 0, payment: row?.payment ?? 0 };
  });

  return {
    month,
    from: start.toISOString(),
    to: end.toISOString(),
    openingBaki: opening,
    creditGiven: given,
    creditCount: during[0]?.creditCount ?? 0,
    collected,
    paymentCount: during[0]?.paymentCount ?? 0,
    netChange: given - collected,
    closingBaki: closing,
    collectionRate,
    newCustomers,
    customersOwing: balances.length,
    topDebtors: balances.slice(0, 10).map((row) => ({
      customerId: row._id.toString(),
      name: names.get(row._id.toString())?.name ?? "—",
      phone: names.get(row._id.toString())?.phone ?? "",
      balance: row.balance,
    })),
    daily: series,
  };
}

/** Every transaction in the month, oldest first, for export. */
export async function getMonthTransactions(userId: string, month: string) {
  const { start, end } = monthRange(month);

  return Transaction.find({ userId, createdAt: { $gte: start, $lt: end } })
    .sort({ createdAt: 1, _id: 1 })
    .populate<{ customerId: { name: string; phone: string } | null }>({
      path: "customerId",
      select: "name phone",
    })
    .lean();
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  // Quote everything; neutralise spreadsheet formulas (=, +, -, @).
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Excel-friendly CSV (UTF-8 BOM so Bangla names display correctly). */
export async function buildMonthCsv(userId: string, month: string) {
  const rows = await getMonthTransactions(userId, month);

  const dhaka = (date: Date | undefined) =>
    date ? new Date(date.getTime() + DHAKA_OFFSET_MS).toISOString().replace("T", " ").slice(0, 16) : "";

  const header = ["Date (Dhaka)", "Customer", "Phone", "Type", "Amount (BDT)", "Note", "Due date"];

  const lines = rows.map((row) =>
    [
      dhaka(row.createdAt),
      row.customerId?.name ?? "",
      row.customerId?.phone ?? "",
      row.type === "CREDIT" ? "Baki given" : "Payment",
      row.amount,
      row.description ?? "",
      row.type === "CREDIT" ? dhaka(row.dueDate).slice(0, 10) : "",
    ]
      .map(csvCell)
      .join(",")
  );

  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n") + "\r\n";
}
