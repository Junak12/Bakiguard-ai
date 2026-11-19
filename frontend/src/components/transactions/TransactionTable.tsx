"use client";

import { Receipt } from "lucide-react";

import { Transaction } from "@/types/transaction";

import TransactionRow from "./TransactionRow";
import TransactionPagination from "./TransactionPagination";
import TransactionSkeleton from "./TransactionSkeleton";
import TransactionEmptyState from "./TransactionEmptyState";
import TransactionMobileCard from "./TransactionMobileCard";

interface Props {
  transactions: Transaction[];
  loading: boolean;
  total: number;
  page: number;
  totalPages: number;
  hasFilters: boolean;
  onPageChange: (page: number) => void;
}

export default function TransactionTable({
  transactions,
  loading,
  total,
  page,
  totalPages,
  hasFilters,
  onPageChange,
}: Props) {
  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* HEADER */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b border-slate-200
          bg-white
          px-4
          py-5
          sm:px-6
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-blue-50
            "
          >
            <Receipt
              className="
                h-5
                w-5
                text-blue-600
              "
            />
          </div>

          <div>
            <h2
              className="
                text-sm
                font-semibold
                text-slate-900
              "
            >
              Transaction History
            </h2>

            <p
              className="
                mt-0.5
                text-xs
                text-slate-500
              "
            >
              {total.toLocaleString()} total transactions
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP */}

      <div className="hidden md:block">
        {loading ? (
          <TransactionSkeleton />
        ) : transactions.length === 0 ? (
          <TransactionEmptyState
            hasFilters={hasFilters}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr
                  className="
                    border-b border-slate-200
                    bg-slate-50
                    text-left
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="px-6 py-4">
                    Customer
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4 text-right">
                    Amount
                  </th>

                  <th className="px-6 py-4">
                    Description
                  </th>
                </tr>
              </thead>

              <tbody
                className="
                  divide-y
                  divide-slate-100
                  bg-white
                "
              >
                {transactions.map(
                  (transaction) => (
                    <TransactionRow
                      key={transaction._id}
                      transaction={transaction}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MOBILE */}

      <div
        className="
          divide-y
          divide-slate-100
          bg-white
          md:hidden
        "
      >
        {loading ? (
          <TransactionSkeleton />
        ) : transactions.length === 0 ? (
          <TransactionEmptyState
            hasFilters={hasFilters}
          />
        ) : (
          transactions.map(
            (transaction) => (
              <TransactionMobileCard
                key={transaction._id}
                transaction={transaction}
              />
            )
          )
        )}
      </div>

      {/* PAGINATION */}

      {!loading && (
        <TransactionPagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
}