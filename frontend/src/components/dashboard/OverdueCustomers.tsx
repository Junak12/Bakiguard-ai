"use client";

import Link from "next/link";
import { ChevronRight, PhoneCall } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import { daysFromToday } from "@/i18n/format";
import type { Customer } from "@/types/customer";

/** Overdue customers, most late first, with one-tap call. */
export default function OverdueCustomers({ customers }: { customers: Customer[] | null }) {
  const { t, money, number } = useI18n();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-bold text-slate-900">{t("ai.overdueListTitle")}</h2>
        <p className="text-xs text-slate-500">{t("ai.overdueListSubtitle")}</p>
      </div>

      {!customers ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <p className="p-8 text-center text-sm font-medium text-emerald-700">{t("ai.overdueListEmpty")}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {customers.map((customer) => {
            const lateDays = customer.nextDueAt ? -daysFromToday(customer.nextDueAt) : 0;

            return (
              <li key={customer._id} className="flex items-center gap-2 px-3 sm:px-5">
                <Link
                  href={`/customers/${customer._id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{customer.name}</p>
                    <p className="text-xs font-medium text-rose-600">
                      {lateDays > 0 ? t("ai.lateBy", { days: number(lateDays) }) : t("ai.dueToday")}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-slate-900">{money(customer.totalDue)}</p>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>

                <a
                  href={`tel:${customer.phone}`}
                  aria-label={customer.phone}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                >
                  <PhoneCall className="h-4 w-4" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
