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

/** Bangla keyboards type ০-৯; the ledger stores 0-9. */
export function toAsciiDigits(value: string) {
  return value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
}

/**
 * Accepts the ways people write Bangladeshi mobile numbers
 * (01712-345678, +8801712345678, 8801712345678, with spaces/dashes)
 * and stores one canonical form: 01712345678.
 * One format means duplicate detection and SMS reminders both work.
 */
export const bdPhoneSchema = z
  .string()
  .trim()
  .transform(toAsciiDigits)
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

export type Pagination = z.infer<typeof paginationSchema>;
