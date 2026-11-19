"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import type { Transaction } from "@/types/transaction";

interface RecentTransactionsProps {
  transactions: Transaction[] | null;
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { t, money, dateTime } = useI18n();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="font-bold text-slate-900">{t("dashboard.recent.title")}</h2>
          <p className="text-xs text-slate-500">{t("dashboard.recent.subtitle")}</p>
        </div>
        <Link href="/transactions" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
          {t("common.viewAll")}
        </Link>
      </div>

      {!transactions ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">{t("dashboard.recent.empty")}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {transactions.map((transaction) => {
            const isCredit = transaction.type === "CREDIT";
            const customer = transaction.customerId;

            return (
              <li key={transaction._id}>
                <Link
                  href={customer?._id ? `/customers/${customer._id}` : "/transactions"}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isCredit ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{customer?.name ?? "—"}</p>
                    <p className="truncate text-xs text-slate-500">
                      {transaction.description || t(isCredit ? "dashboard.recent.credit" : "dashboard.recent.payment")}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold ${isCredit ? "text-amber-600" : "text-emerald-600"}`}>
                      {isCredit ? "+" : "−"}
                      {money(transaction.amount)}
                    </p>
                    <p className="text-xs text-slate-400">{dateTime(transaction.createdAt)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
