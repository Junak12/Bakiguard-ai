import { Request, Response } from "express";

;

import {
  createTransaction,
  getCustomerTransactions,
} from "../services/transaction.service";

import { AuthRequest } from "../middleware/auth.middleware";
import { createTransactionSchema } from "../validators/transaction.validator";

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

    const result =
      createTransactionSchema.safeParse(
        req.body
      );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:
          result.error.flatten()
            .fieldErrors,
      });
    }

    const transaction =
      await createTransaction(
        req.userId,
        result.data
      );

    return res.status(201).json({
      success: true,
      message:
        "Transaction created successfully",
      data: transaction,
    });
  } catch (error: any) {
    console.error(error);

    if (error.statusCode) {
      return res.status(
        error.statusCode
      ).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getCustomerTransactionsController(
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

    const { customerId } = req.params;

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 10,
        1
      ),
      100
    );

    const result =
      await getCustomerTransactions(
        req.userId,
        customerId,
        page,
        limit
      );

    return res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error(error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}