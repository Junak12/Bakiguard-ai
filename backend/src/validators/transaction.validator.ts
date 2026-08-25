import { z } from "zod";

export const createTransactionSchema =
  z.object({
    customerId: z
      .string()
      .min(1, "Customer is required"),

    type: z.enum([
      "CREDIT",
      "PAYMENT",
    ]),

    amount: z
      .number()
      .positive("Amount must be greater than 0"),

    description: z
      .string()
      .max(300)
      .optional(),
  });

export type CreateTransactionInput =
  z.infer<
    typeof createTransactionSchema
  >;