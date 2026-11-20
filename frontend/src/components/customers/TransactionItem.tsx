"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import { daysFromToday } from "@/i18n/format";
import type { Transaction } from "@/types/transaction";

export default function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { t, money, number, date, dateTime } = useI18n();

  const user = useSessionUser();
  const isCredit = transaction.type === "CREDIT";

  // Only worth showing once someone other than the owner enters records.
  const enteredBy =
    transaction.createdBy && transaction.createdBy._id !== user?.shopId ? transaction.createdBy.name : null;

  // Repayment status of a credit: paid, partly paid, late.
  let creditStatus: { text: string; tone: string } | null = null;

  if (isCredit && transaction.outstanding !== undefined) {
    if (transaction.outstanding === 0) {
      creditStatus = { text: t("customers.history.paid"), tone: "bg-emerald-50 text-emerald-700" };
    } else if (transaction.dueDate && daysFromToday(transaction.dueDate) < 0) {
      creditStatus = {
        text: t("customers.history.lateBy", { days: number(-daysFromToday(transaction.dueDate)) }),
        tone: "bg-rose-50 text-rose-700",
      };
    } else if (transaction.outstanding < transaction.amount) {
      creditStatus = {
        text: t("customers.history.partlyPaid", { amount: money(transaction.outstanding) }),
        tone: "bg-amber-50 text-amber-700",
      };
    }
  }

  return (
    <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isCredit ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">
          {t(isCredit ? "customers.history.credit" : "customers.history.payment")}
        </p>
        <p className="truncate text-sm text-slate-500">
          {transaction.description || t("customers.history.noNote")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>{dateTime(transaction.createdAt)}</span>
          {enteredBy && <span>· {t("team.enteredBy", { name: enteredBy })}</span>}
          {isCredit && transaction.dueDate && transaction.outstanding !== 0 && (
            <span>· {t("customers.history.due", { date: date(transaction.dueDate) })}</span>
          )}
          {creditStatus && (
            <span className={`rounded-full px-2 py-0.5 font-semibold ${creditStatus.tone}`}>
              {creditStatus.text}
            </span>
          )}
        </div>
      </div>

      <p className={`shrink-0 font-bold ${isCredit ? "text-amber-600" : "text-emerald-600"}`}>
        {isCredit ? "+" : "−"}
        {money(transaction.amount)}
      </p>
    </div>
  );
}
