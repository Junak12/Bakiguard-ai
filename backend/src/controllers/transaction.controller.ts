import type { Response } from "express";

import type { AuthRequest } from "../middleware/auth.middleware.js";

import { createTransactionSchema } from "../validators/transaction.validator.js";

import {
  createTransaction,
  getCustomerTransactions,
  getCustomerBalance,
} from "../services/transaction.service.js";

export async function create(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = createTransactionSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const transaction = await createTransaction(
      req.userId,
      result.data
    );

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Customer not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}


export async function getHistory(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const transactions = await getCustomerTransactions(
      req.userId,
      req.params.customerId
    );

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Customer not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getBalance(
  req: AuthRequest,
  res: Response
) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const balance = await getCustomerBalance(
      req.userId,
      req.params.customerId
    );

    return res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Customer not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}