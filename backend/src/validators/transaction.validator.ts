import { z } from "zod";

import { TRANSACTION_TYPES } from "../model/Transaction.js";
import {
  amountSchema,
  objectIdSchema,
  paginationSchema,
} from "./common.validator.js";

export const createTransactionSchema = z.object({
  customerId: objectIdSchema,

  type: z.enum(TRANSACTION_TYPES),

  amount: amountSchema,

  description: z.string().trim().max(300).optional(),
});

export const customerIdParamSchema = z.object({
  customerId: objectIdSchema,
});

export const listTransactionsQuerySchema = paginationSchema;

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
