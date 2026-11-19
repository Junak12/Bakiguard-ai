import { z } from "zod";

import { TRANSACTION_TYPES } from "../model/Transaction.js";
import {
  amountSchema,
  objectIdSchema,
  paginationSchema,
} from "./common.validator.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const createTransactionSchema = z
  .object({
    customerId: objectIdSchema,

    type: z.enum(TRANSACTION_TYPES),

    amount: amountSchema,

    description: z.string().trim().max(300).optional(),

    // CREDIT only. Defaults to the shop's credit term.
    dueDate: z.coerce
      .date({ error: "Invalid due date" })
      .refine((date) => date.getTime() > Date.now() - DAY_MS, {
        message: "Due date cannot be in the past",
      })
      .refine((date) => date.getTime() < Date.now() + 366 * DAY_MS, {
        message: "Due date must be within a year",
      })
      .optional(),
  })
  .refine((value) => value.type === "CREDIT" || value.dueDate === undefined, {
    message: "Only credit entries have a due date",
    path: ["dueDate"],
  });

export const customerIdParamSchema = z.object({
  customerId: objectIdSchema,
});

export const listTransactionsQuerySchema = paginationSchema;

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
