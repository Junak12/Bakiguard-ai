import mongoose from "mongoose";

import { Customer } from "../model/Customer.js";
import { Transaction } from "../model/Transaction.js";

export interface DashboardStats {
  totalCustomers: number;
  totalCredit: number;
  totalPayment: number;
  /** Sum of every customer's current balance: the money owed to the shop right now. */
  totalBaki: number;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [customerTotals, transactionTotals] = await Promise.all([
    Customer.aggregate<{ totalCustomers: number; totalBaki: number }>([
      { $match: { userId: userObjectId, isArchived: false } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalBaki: { $sum: "$totalDue" },
        },
      },
    ]),

    Transaction.aggregate<{ totalCredit: number; totalPayment: number }>([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: null,
          totalCredit: {
            $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] },
          },
          totalPayment: {
            $sum: { $cond: [{ $eq: ["$type", "PAYMENT"] }, "$amount", 0] },
          },
        },
      },
    ]),
  ]);

  return {
    totalCustomers: customerTotals[0]?.totalCustomers ?? 0,
    totalBaki: customerTotals[0]?.totalBaki ?? 0,
    totalCredit: transactionTotals[0]?.totalCredit ?? 0,
    totalPayment: transactionTotals[0]?.totalPayment ?? 0,
  };
}
