"use client";

import {
  CreditCard,
  Wallet,
} from "lucide-react";

import { Customer } from "@/types/customer";
import { Transaction } from "@/types/transaction";

import TransactionItem from "./TransactionItem";

interface Props {
  customer: Customer;

  transactions: Transaction[];

  onAddCredit: () => void;

  onAddPayment: () => void;
}

export default function CustomerTransactions({
  customer,
  transactions,
  onAddCredit,
  onAddPayment,
}: Props) {
  return (
    <section className="mt-7 sm:mt-9">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <div className="flex items-center gap-2">

            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Transactions
            </h2>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
              {transactions.length}
            </span>

          </div>

          <p className="mt-1 text-sm text-slate-500">
            Credit and payment history for this customer.
          </p>

        </div>

        {/* ACTIONS */}

        <div className="grid grid-cols-2 gap-2 sm:flex">

          <button
            type="button"
            onClick={onAddCredit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:text-sm"
          >
            <CreditCard className="h-4 w-4" />

            Add Credit
          </button>

          <button
            type="button"
            onClick={onAddPayment}
            disabled={customer.totalDue <= 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            <Wallet className="h-4 w-4" />

            Add Payment
          </button>

        </div>

      </div>

      {/* LIST */}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">

        {transactions.length === 0 ? (

          <div className="px-5 py-14 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Wallet className="h-6 w-6 text-slate-400" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No transactions yet
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500 sm:text-sm">
              Add a credit or payment to start building this customer's transaction history.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {transactions.map(
              (transaction) => (
                <TransactionItem
                  key={transaction._id}
                  transaction={transaction}
                />
              )
            )}

          </div>

        )}

      </div>

    </section>
  );
}