import mongoose from "mongoose";



import type { CreateTransactionInput } from "../validators/transaction.validator.js";
import { Customer } from "../model/Customer.js";
import { Transaction } from "../model/Transaction.js";

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput
) {
  const customer = await Customer.findOne({
    _id: input.customerId,
    userId,
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const transaction = await Transaction.create({
    userId,
    customerId: input.customerId,
    type: input.type,
    amount: input.amount,
    description: input.description,
    transactionDate: input.transactionDate
      ? new Date(input.transactionDate)
      : new Date(),
  });

  return transaction;
}


export async function getCustomerTransactions(
  userId: string,
  customerId: string
) {
  const customer = await Customer.findOne({
    _id: customerId,
    userId,
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return Transaction.find({
    userId,
    customerId,
  }).sort({
    transactionDate: -1,
  });
}


export async function getCustomerBalance(
  userId: string,
  customerId: string
) {
  const customer = await Customer.findOne({
    _id: customerId,
    userId,
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const result = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        customerId: new mongoose.Types.ObjectId(customerId),
      },
    },
    {
      $group: {
        _id: "$type",
        total: {
          $sum: "$amount",
        },
      },
    },
  ]);

  let credit = 0;
  let payment = 0;

  for (const item of result) {
    if (item._id === "CREDIT") {
      credit = item.total;
    }

    if (item._id === "PAYMENT") {
      payment = item.total;
    }
  }

  return {
    credit,
    payment,
    due: Math.max(credit - payment, 0),
  };
}