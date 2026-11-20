"use client";

import Link from "next/link";
import { ChevronRight, ShieldAlert } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import type { RiskOverviewItem } from "@/lib/risk";
import type { RiskBand } from "@/types/customer";

import RiskBadge from "./RiskBadge";
import { useRiskText } from "./useRiskText";

interface Props {
  items: RiskOverviewItem[] | null;
  summary: Record<RiskBand, number> | null;
  failed: boolean;
}

/** High and medium risk customers, riskiest first, with their main reason. */
export default function RiskList({ items, summary, failed }: Props) {
  const { t, money, number } = useI18n();
  const { reasonText } = useRiskText();

  const risky = items?.filter((item) => item.risk.band === "high" || item.risk.band === "medium") ?? null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{t("risk.listTitle")}</h2>
            <p className="text-xs text-slate-500">{t("risk.listSubtitle")}</p>
          </div>
        </div>

        {summary && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {(["high", "medium", "new", "low"] as const).map((band) => (
              <span key={band} className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                {t(`risk.summary.${band}`, { count: number(summary[band]) })}
              </span>
            ))}
          </div>
        )}
      </div>

      {failed ? (
        <p className="p-5 text-sm text-slate-500">{t("risk.unavailable")}</p>
      ) : !risky ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : risky.length === 0 ? (
        <p className="p-8 text-center text-sm font-medium text-emerald-700">{t("risk.listEmpty")}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {risky.map(({ customer, risk }) => {
            const mainReason = risk.reasons.map(reasonText).find(Boolean);

            return (
              <li key={customer._id}>
                <Link
                  href={`/customers/${customer._id}`}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{customer.name}</p>
                      <RiskBadge band={risk.band} />
                    </div>
                    {mainReason && <p className="mt-0.5 truncate text-xs text-slate-500">{mainReason}</p>}
                  </div>
                  <p className="shrink-0 font-bold text-slate-900">{money(customer.totalDue)}</p>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
