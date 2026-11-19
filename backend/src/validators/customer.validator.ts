import { z } from "zod";

import { bdPhoneSchema } from "./common.validator.js";

export { bdPhoneSchema };

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  phone: bdPhoneSchema,

  address: z
    .string()
    .trim()
    .max(300, "Address cannot exceed 300 characters")
    .optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nothing to update",
  });

export const listCustomersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["all", "due", "overdue"]).default("all"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
