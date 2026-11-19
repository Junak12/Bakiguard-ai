import {
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";

import { Transaction } from "@/types/transaction";

import TransactionTypeBadge from "./TransactionTypeBadge";

import {
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/formatters";

interface Props {
  transaction: Transaction;
}

export default function TransactionMobileCard({
  transaction,
}: Props) {
  const isCredit = transaction.type === "CREDIT";

  return (
    <div
      className="
        flex
        items-center
        gap-4
        border-b
        border-slate-100
        bg-white
        px-4
        py-5
        last:border-0

        dark:border-slate-800
        dark:bg-slate-950
      "
    >
      {/* LEFT CONTENT */}

      <div
        className="
          flex
          min-w-0
          flex-1
          items-center
          gap-3
        "
      >
        {/* ICON */}

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl

            ${
              isCredit
                ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400"
                : "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400"
            }
          `}
        >
          <ArrowUpRight
            className={`
              h-5
              w-5
              ${!isCredit ? "rotate-180" : ""}
            `}
          />
        </div>

        {/* DETAILS */}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3
              className="
                truncate
                text-sm
                font-semibold
                text-slate-900

                dark:text-white
              "
            >
              {isCredit ? "Credit" : "Payment"}
            </h3>

            <TransactionTypeBadge
              type={transaction.type}
            />
          </div>

          <p
            className="
              mt-1
              truncate
              text-sm
              text-slate-500

              dark:text-slate-400
            "
          >
            {transaction.description ||
              "No description"}
          </p>

          <div
            className="
              mt-2
              flex
              items-center
              gap-1.5
              text-xs
              text-slate-400

              dark:text-slate-500
            "
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />

            <span className="truncate">
              {formatDate(transaction.createdAt)}
            </span>

            <span className="text-slate-300 dark:text-slate-700">
              •
            </span>

            <span className="shrink-0">
              {formatTime(transaction.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* AMOUNT */}

      <div
        className={`
          w-[105px]
          shrink-0
          text-right
          text-sm
          font-bold

          ${
            isCredit
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          }
        `}
      >
        {isCredit ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </div>
    </div>
  );
}