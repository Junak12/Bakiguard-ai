export type Language = "bn" | "en";

export const LANGUAGES: Language[] = ["bn", "en"];

export const DEFAULT_LANGUAGE: Language = "bn";

/**
 * Bangladesh groups digits in lakhs/crores (1,00,000).
 * "bn-BD" gives Bangla digits (১,০০,০০০), "en-IN" the same grouping in 0-9.
 */
const numberLocale: Record<Language, string> = {
  bn: "bn-BD",
  en: "en-IN",
};

const dateLocale: Record<Language, string> = {
  bn: "bn-BD",
  en: "en-GB",
};

export function formatNumber(value: number, lang: Language) {
  return new Intl.NumberFormat(numberLocale[lang], {
    maximumFractionDigits: 0,
  }).format(value);
}

/** ৳১,২৩,৪৫৬ or ৳1,23,456 */
export function formatMoney(value: number, lang: Language) {
  const sign = value < 0 ? "-" : "";
  return `${sign}৳${formatNumber(Math.abs(value), lang)}`;
}

export function formatDate(value: string | Date, lang: Language) {
  return new Intl.DateTimeFormat(dateLocale[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string | Date, lang: Language) {
  return new Intl.DateTimeFormat(dateLocale[lang], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date, lang: Language) {
  return `${formatDate(value, lang)}, ${formatTime(value, lang)}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from today to the date (negative = in the past). */
export function daysFromToday(value: string | Date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const target = new Date(value);
  target.setHours(0, 0, 0, 0);

  return Math.round((target.getTime() - startOfToday.getTime()) / DAY_MS);
}

/** Converts Bangla digits (০-৯) typed on a Bangla keyboard to 0-9. */
export function toAsciiDigits(value: string) {
  return value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
}
