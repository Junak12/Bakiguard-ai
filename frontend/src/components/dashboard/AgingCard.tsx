"use client";

import Link from "next/link";
import { ArrowRight, Hourglass } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import type { AgingReport } from "@/lib/dashboard";
import type { AgingBucket } from "@/types/customer";

const BUCKETS: { key: AgingBucket; bar: string; dot: string }[] = [
  { key: "notDue", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  { key: "d1_30", bar: "bg-amber-400", dot: "bg-amber-400" },
  { key: "d31_60", bar: "bg-orange-500", dot: "bg-orange-500" },
  { key: "d61_90", bar: "bg-rose-500", dot: "bg-rose-500" },
  { key: "d90plus", bar: "bg-rose-800", dot: "bg-rose-800" },
];

/** Unpaid Baki split by how late it is. The single most useful view for collections. */
export default function AgingCard({ report }: { report: AgingReport | null }) {
  const { t, money, number } = useI18n();

  const total = report?.totalOutstanding ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Hourglass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{t("dashboard.aging.title")}</h2>
            <p className="text-xs text-slate-500">{t("dashboard.aging.subtitle")}</p>
          </div>
        </div>
      </div>

      {!report ? (
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-100" />
      ) : total === 0 ? (
        <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {t("dashboard.aging.empty")}
        </p>
      ) : (
        <>
          {/* Stacked bar: share of unpaid money in each bucket */}
          <div className="mt-6 flex h-4 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={t("dashboard.aging.title")}>
            {BUCKETS.map(({ key, bar }) => {
              const share = (report.buckets[key].amount / total) * 100;
              return share > 0 ? <div key={key} className={bar} style={{ width: `${share}%` }} /> : null;
            })}
          </div>

          <ul className="mt-5 divide-y divide-slate-100">
            {BUCKETS.map(({ key, dot }) => {
              const bucket = report.buckets[key];

              return (
                <li key={key} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 text-sm text-slate-700">
                    <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                    {t(`dashboard.aging.${key}`)}
                  </span>
                  <span className="text-right">
                    <span className={`block text-sm font-bold ${bucket.amount > 0 ? "text-slate-900" : "text-slate-300"}`}>
                      {money(bucket.amount)}
                    </span>
                    {bucket.customers > 0 && (
                      <span className="block text-xs text-slate-400">
                        {t("dashboard.aging.customers", { count: number(bucket.customers) })}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          {report.overdueCustomers > 0 && (
            <Link
              href="/customers?status=overdue"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              {t("dashboard.aging.seeOverdue")} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </>
      )}
    </div>
  );
}
