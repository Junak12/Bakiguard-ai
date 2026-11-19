import { z } from "zod";

/**
 * Accepts the ways people write Bangladeshi mobile numbers
 * (01712-345678, +8801712345678, 8801712345678, with spaces/dashes)
 * and stores one canonical form: 01712345678.
 * One format means duplicate detection and SMS reminders both work.
 */
export const bdPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s\-()]/g, ""))
  .transform((value) => value.replace(/^(\+?88)(?=01)/, ""))
  .pipe(
    z
      .string()
      .regex(
        /^01[3-9]\d{8}$/,
        "Enter a valid Bangladeshi mobile number (e.g. 01712345678)"
      )
  );

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
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
