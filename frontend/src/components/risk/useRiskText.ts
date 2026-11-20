"use client";

import { useI18n, type TranslationKey } from "@/i18n/I18nProvider";
import type { RiskReason } from "@/types/customer";

const KNOWN_REASONS = new Set([
  "new_customer",
  "on_time_rate",
  "late_now",
  "usually_late",
  "never_paid",
  "no_recent_payment",
  "recent_payment",
  "long_relationship",
  "stop_credit",
  "pays_monthly",
]);

/** Turns a reason code + params from the scorer into a translated sentence. */
export function useRiskText() {
  const { t, money, number } = useI18n();

  function reasonText(reason: RiskReason): string | null {
    if (!KNOWN_REASONS.has(reason.code)) return null;

    if (reason.code === "recent_payment" && Number(reason.params?.days) === 0) {
      return t("risk.reasons.recent_payment_today");
    }

    const vars: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(reason.params ?? {})) {
      vars[key] =
        typeof value === "number" ? (key === "amount" ? money(value) : number(value)) : String(value);
    }

    return t(`risk.reasons.${reason.code}` as TranslationKey, vars);
  }

  return { reasonText };
}
