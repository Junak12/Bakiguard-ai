import mongoose from "mongoose";
import { z } from "zod";

export const objectIdSchema = z
  .string()
  .refine((value) => mongoose.isValidObjectId(value), {
    message: "Invalid id",
  });

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Money is stored as whole Taka (integers).
 * Floating point amounts like 0.1 + 0.2 never enter the ledger.
 */
export const amountSchema = z
  .number({ error: "Amount must be a number" })
  .int("Amount must be a whole number of Taka")
  .positive("Amount must be greater than 0")
  .max(100_000_000, "Amount is too large");

export type Pagination = z.infer<typeof paginationSchema>;
