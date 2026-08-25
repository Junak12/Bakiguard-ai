import { z } from "zod";

export const createTransactionSchema = z.object({
  customerId: z
    .string()
    .min(1, "Customer ID is required"),

  type: z.enum(["CREDIT", "PAYMENT"]),

  amount: z
    .number()
    .positive("Amount must be greater than 0"),

  description: z
    .string()
    .trim()
    .max(300, "Description cannot exceed 300 characters")
    .optional(),

  transactionDate: z
    .string()
    .datetime()
    .optional(),
});

export type CreateTransactionInput = z.infer<
  typeof createTransactionSchema
>;