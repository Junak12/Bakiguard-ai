"use client";

import { Activity } from "lucide-react";

import type { TransactionSummary } from "@/hooks/customers/useCustomerDetails";
import { useI18n } from "@/i18n/I18nProvider";

/** Uses server-side totals over the customer's whole history (not just the loaded page). */
export default function PaymentBehavior({ summary }: { summary: TransactionSummary | null }) {
  const { t, money, number } = useI18n();

  if (!summary) return null;

  const repaid =
    summary.totalCredit > 0
      ? Math.min(100, Math.round((summary.totalPayment / summary.totalCredit) * 100))
      : 0;

  const averagePayment =
    summary.paymentCount > 0 ? Math.round(summary.totalPayment / summary.paymentCount) : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{t("customers.behavior.title")}</h2>
          <p className="text-xs text-slate-500">{t("customers.behavior.subtitle")}</p>
        </div>
      </div>

      {summary.creditCount + summary.paymentCount === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t("customers.behavior.empty")}</p>
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t("customers.behavior.totalCredit")}</dt>
              <dd className="mt-1 font-bold text-slate-900">{money(summary.totalCredit)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t("customers.behavior.totalPaid")}</dt>
              <dd className="mt-1 font-bold text-emerald-700">{money(summary.totalPayment)}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t("customers.behavior.averagePayment")}</dt>
              <dd className="mt-1 font-bold text-slate-900">{money(averagePayment)}</dd>
            </div>
          </dl>

          <div className="mt-5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${repaid}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {t("customers.behavior.repaid", { percent: number(repaid) })}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
