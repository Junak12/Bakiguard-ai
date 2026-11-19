import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";

import { Transaction } from "@/types/transaction";

interface Props {
  transaction: Transaction;
}

export default function TransactionItem({
  transaction,
}: Props) {
  const isCredit =
    transaction.type === "CREDIT";

  const date = new Date(
    transaction.createdAt
  );

  return (
    <div className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:p-5">

      <div className="flex min-w-0 items-center gap-3 sm:gap-4">

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isCredit
              ? "bg-amber-50 text-amber-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft className="h-5 w-5" />
          ) : (
            <ArrowUpRight className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <p className="text-sm font-semibold text-slate-900">
              {isCredit
                ? "Credit"
                : "Payment"}
            </p>

            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                isCredit
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {transaction.type}
            </span>

          </div>

          <p className="mt-1 truncate text-xs text-slate-500">
            {transaction.description ||
              "No description"}
          </p>

          {/* DATE */}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">

            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />

              {date.toLocaleDateString(
                "en-BD",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              )}
            </span>

            <span>
              {date.toLocaleTimeString(
                "en-BD",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </span>

          </div>

        </div>

      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">

        <span className="text-xs font-medium text-slate-400 sm:hidden">
          Amount
        </span>

        <p
          className={`text-base font-bold sm:text-sm ${
            isCredit
              ? "text-amber-600"
              : "text-emerald-600"
          }`}
        >
          {isCredit ? "+" : "-"}৳
          {transaction.amount.toLocaleString()}
        </p>

      </div>

    </div>
  );
}