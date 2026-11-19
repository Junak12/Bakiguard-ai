import mongoose from "mongoose";
import type { CreateTransactionInput } from "../validators/transaction.validator";
import { Customer } from "../model/Customer";
import { Transaction } from "../model/Transaction";

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const customer = await Customer.findOne({
      _id: input.customerId,
      userId,
    }).session(session);

    if (!customer) {
      const error = new Error(
        "Customer not found."
      );

      (error as any).statusCode = 404;

      throw error;
    }

    if (
      input.type === "PAYMENT" &&
      input.amount > customer.totalDue
    ) {
      const error = new Error(
        "Payment cannot be greater than the current Baki."
      );

      (error as any).statusCode = 400;

      throw error;
    }

    const transaction =
      await Transaction.create(
        [
          {
            userId,
            customerId: customer._id,
            type: input.type,
            amount: input.amount,
            description: input.description,
          },
        ],
        { session }
      );

    if (input.type === "CREDIT") {
      customer.totalDue += input.amount;
    } else {
      customer.totalDue -= input.amount;
    }

    await customer.save({ session });

    await session.commitTransaction();

    return transaction[0];
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
}

export async function getCustomerTransactions(
  userId: string,
  customerId: string,
  page: number,
  limit: number
) {
  const customer = await Customer.findOne({
    _id: customerId,
    userId,
  });

  if (!customer) {
    const error = new Error("Customer not found.");
    (error as any).statusCode = 404;
    throw error;
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    Transaction.find({
      userId,
      customerId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .lean(),

    Transaction.countDocuments({
      userId,
      customerId,
    }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}