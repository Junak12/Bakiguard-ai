import mongoose from "mongoose";

import { Customer } from "../model/Customer.js";
import { Transaction, type ITransaction } from "../model/Transaction.js";
import { User } from "../model/User.js";
import { AppError } from "../utils/AppError.js";
import type { Pagination } from "../validators/common.validator.js";
import type {
  CreateTransactionInput,
  TransactionFilters,
} from "../validators/transaction.validator.js";
import {
  addDays,
  LEGACY_CREDIT_DAYS,
  refreshNextDue,
  settleCreditsFifo,
} from "./ledger.service.js";

function paginationMeta({ page, limit }: Pagination, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Records a CREDIT (customer took goods on Baki) or a PAYMENT (customer paid)
 * and updates the customer's balance in the same database transaction.
 *
 * The balance change is a single conditional $inc, so two payments recorded
 * at the same moment can never take a balance below zero.
 *
 * Credits get a due date (given, or the shop's default term). Payments settle
 * the oldest unpaid credits first, keeping per-credit `outstanding` in sync.
 */
export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
) {
  const session = await mongoose.startSession();

  try {
    let created: ITransaction | undefined;

    // withTransaction retries automatically on transient write conflicts.
    await session.withTransaction(async () => {
      const now = new Date();
      const isPayment = input.type === "PAYMENT";

      const customer = await Customer.findOneAndUpdate(
        {
          _id: input.customerId,
          userId,
          isArchived: false,
          ...(isPayment ? { totalDue: { $gte: input.amount } } : {}),
        },
        {
          $inc: { totalDue: isPayment ? -input.amount : input.amount },
          $set: isPayment ? { lastPaymentAt: now } : { lastCreditAt: now },
        },
        { returnDocument: "after", session }
      );

      if (!customer) {
        // Work out which condition failed, to give a useful message.
        const exists = await Customer.findOne(
          { _id: input.customerId, userId, isArchived: false },
          { totalDue: 1 },
          { session }
        ).lean();

        if (!exists) {
          throw AppError.notFound("Customer not found");
        }

        throw AppError.badRequest(
          `Payment cannot be more than the current Baki (৳${exists.totalDue.toLocaleString("en-US")}).`,
          "PAYMENT_EXCEEDS_DUE"
        );
      }

      let dueDate: Date | undefined;

      if (!isPayment) {
        const owner = await User.findById(userId, { defaultCreditDays: 1 }, { session }).lean();
        dueDate = input.dueDate ?? addDays(now, owner?.defaultCreditDays ?? LEGACY_CREDIT_DAYS);
      }

      [created] = await Transaction.create(
        [
          {
            userId,
            customerId: customer._id,
            type: input.type,
            amount: input.amount,
            description: input.description,
            ...(isPayment ? {} : { dueDate, outstanding: input.amount }),
          },
        ],
        { session }
      );

      if (isPayment) {
        await settleCreditsFifo(userId, input.customerId, input.amount, session);
      }

      await refreshNextDue(userId, input.customerId, session);
    });

    return created!;
  } finally {
    await session.endSession();
  }
}

export async function getCustomerTransactions(
  userId: string,
  customerId: string,
  pagination: Pagination
) {
  const customerExists = await Customer.exists({ _id: customerId, userId });

  if (!customerExists) {
    throw AppError.notFound("Customer not found");
  }

  const filter = {
    userId: new mongoose.Types.ObjectId(userId),
    customerId: new mongoose.Types.ObjectId(customerId),
  };

  const [transactions, total, summary] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .select("-__v")
      .lean(),

    Transaction.countDocuments(filter),

    Transaction.aggregate<{
      totalCredit: number;
      totalPayment: number;
      creditCount: number;
      paymentCount: number;
    }>([
      { $match: filter },
      {
        $group: {
          _id: null,
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
        },
      },
      { $project: { _id: 0 } },
    ]),
  ]);

  return {
    transactions,
    summary: summary[0] ?? {
      totalCredit: 0,
      totalPayment: 0,
      creditCount: 0,
      paymentCount: 0,
    },
    pagination: paginationMeta(pagination, total),
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getTransactions(
  userId: string,
  pagination: Pagination,
  filters: TransactionFilters = {}
) {
  const filter: Record<string, unknown> = { userId };

  if (filters.type) {
    filter.type = filters.type;
  }

  if (filters.from || filters.to) {
    filter.createdAt = {
      ...(filters.from ? { $gte: filters.from } : {}),
      ...(filters.to ? { $lte: filters.to } : {}),
    };
  }

  if (filters.search) {
    // Includes archived customers so their history is still searchable.
    const pattern = new RegExp(escapeRegex(filters.search), "i");
    const matches = await Customer.find(
      { userId, $or: [{ name: pattern }, { phone: pattern }] },
      { _id: 1 }
    ).lean();

    filter.customerId = { $in: matches.map((customer) => customer._id) };
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((pagination.page - 1) * pagination.limit)
      .limit(pagination.limit)
      .populate({ path: "customerId", select: "name phone" })
      .select("-__v")
      .lean(),

    Transaction.countDocuments(filter),
  ]);

  return {
    transactions,
    pagination: paginationMeta(pagination, total),
  };
}
