import type { Response } from "express";

import { getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import {
  createTransaction,
  getCustomerTransactions,
  getTransactions,
} from "../services/transaction.service.js";
import {
  createTransactionSchema,
  customerIdParamSchema,
  listTransactionsQuerySchema,
} from "../validators/transaction.validator.js";

export async function create(req: AuthRequest, res: Response) {
  const input = createTransactionSchema.parse(req.body);

  const transaction = await createTransaction(getUserId(req), input);

  res.status(201).json({
    success: true,
    message: "Transaction recorded successfully",
    data: transaction,
  });
}

export async function getCustomerTransactionsController(
  req: AuthRequest,
  res: Response
) {
  const { customerId } = customerIdParamSchema.parse(req.params);
  const pagination = listTransactionsQuerySchema.parse(req.query);

  const result = await getCustomerTransactions(
    getUserId(req),
    customerId,
    pagination
  );

  res.status(200).json({
    success: true,
    data: result.transactions,
    summary: result.summary,
    pagination: result.pagination,
  });
}

export async function getTransactionsController(req: AuthRequest, res: Response) {
  const pagination = listTransactionsQuerySchema.parse(req.query);

  const result = await getTransactions(getUserId(req), pagination);

  res.status(200).json({
    success: true,
    data: result.transactions,
    pagination: result.pagination,
  });
}
