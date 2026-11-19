import { toAsciiDigits } from "@/i18n/format";

/** Same rules as the server: accepts +880/880/Bangla digits, returns 01XXXXXXXXX. */
export function normalizePhone(input: string) {
  return toAsciiDigits(input)
    .trim()
    .replace(/[\s\-()]/g, "")
    .replace(/^(\+?88)(?=01)/, "");
}

export const BD_PHONE_PATTERN = /^01[3-9]\d{8}$/;

export function isValidPhone(input: string) {
  return BD_PHONE_PATTERN.test(normalizePhone(input));
}
