import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number is too short")
    .max(15, "Phone number is too long"),

  address: z
    .string()
    .trim()
    .max(300, "Address cannot exceed 300 characters")
    .optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<
  typeof createCustomerSchema
>;

export type UpdateCustomerInput = z.infer<
  typeof updateCustomerSchema
>;