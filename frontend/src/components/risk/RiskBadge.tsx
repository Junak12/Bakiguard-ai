"use client";

import { useI18n } from "@/i18n/I18nProvider";
import type { RiskBand } from "@/types/customer";

export const BAND_STYLE: Record<RiskBand, { pill: string; dot: string; bar: string }> = {
  new: { pill: "bg-sky-50 text-sky-700", dot: "bg-sky-500", bar: "bg-sky-500" },
  low: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  medium: { pill: "bg-amber-50 text-amber-800", dot: "bg-amber-500", bar: "bg-amber-500" },
  high: { pill: "bg-rose-50 text-rose-700", dot: "bg-rose-600", bar: "bg-rose-600" },
};

export default function RiskBadge({ band, className = "" }: { band: RiskBand; className?: string }) {
  const { t } = useI18n();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BAND_STYLE[band].pill} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${BAND_STYLE[band].dot}`} />
      {t(`risk.bands.${band}`)}
    </span>
  );
}
