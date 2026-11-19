import { ArrowUpRight } from "lucide-react";

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

export default function TransactionRow({
  transaction,
}: Props) {
  const isCredit = transaction.type === "CREDIT";

  return (
    <tr
      className="
        border-b
        border-slate-100
        last:border-0
        bg-white
      "
    >
      {/* DATE */}

      <td className="px-6 py-4">
        <div className="space-y-1">
          <p
            className="
              text-sm
              font-medium
              !text-slate-800
            "
          >
            {formatDate(transaction.createdAt)}
          </p>

          <p
            className="
              text-xs
              !text-slate-500
            "
          >
            {formatTime(transaction.createdAt)}
          </p>
        </div>
      </td>

      {/* CUSTOMER */}

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-blue-50
              text-sm
              font-semibold
              text-blue-600
            "
          >
            {(
              transaction.customerId?.name || "U"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-sm
                font-semibold
                !text-slate-900
              "
            >
              {transaction.customerId?.name ||
                "Unknown Customer"}
            </p>

            {transaction.customerId?.phone && (
              <p
                className="
                  text-xs
                  !text-slate-500
                "
              >
                {transaction.customerId.phone}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* TYPE */}

      <td className="px-6 py-4">
        <TransactionTypeBadge
          type={transaction.type}
        />
      </td>

      {/* AMOUNT */}

      <td className="px-6 py-4 text-right">
        <div
          className={`
            inline-flex
            items-center
            gap-1
            text-sm
            font-bold

            ${
              isCredit
                ? "text-red-600"
                : "text-emerald-600"
            }
          `}
        >
          <ArrowUpRight
            className={`
              h-3.5
              w-3.5
              ${isCredit ? "" : "rotate-180"}
            `}
          />

          {formatCurrency(transaction.amount)}
        </div>
      </td>

      {/* DESCRIPTION */}

      <td className="max-w-xs px-6 py-4">
        <p
          className="
            truncate
            text-sm
            !text-slate-500
          "
          title={
            transaction.description ||
            "No description"
          }
        >
          {transaction.description ||
            "No description"}
        </p>
      </td>
    </tr>
  );
}