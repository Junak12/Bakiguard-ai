"use client";

import {
  Activity,
  CalendarDays,
  CreditCard,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Transaction } from "@/types/transaction";

interface PaymentBehaviorProps {
  transactions: Transaction[];
}

export default function PaymentBehavior({
  transactions,
}: PaymentBehaviorProps) {
  const payments = transactions
    .filter((transaction) => transaction.type === "PAYMENT")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );

  const credits = transactions.filter(
    (transaction) => transaction.type === "CREDIT"
  );

  // ---------------------------------------------------------
  // PAYMENT TOTAL
  // ---------------------------------------------------------

  const totalPayments = payments.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  // ---------------------------------------------------------
  // CREDIT TOTAL
  // ---------------------------------------------------------

  const totalCredits = credits.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  // ---------------------------------------------------------
  // AVERAGE PAYMENT
  // ---------------------------------------------------------

  const averagePayment =
    payments.length > 0
      ? totalPayments / payments.length
      : 0;

  // ---------------------------------------------------------
  // LARGEST PAYMENT
  // ---------------------------------------------------------

  const largestPayment =
    payments.length > 0
      ? Math.max(
          ...payments.map(
            (transaction) => transaction.amount
          )
        )
      : 0;

  // ---------------------------------------------------------
  // PAYMENT FREQUENCY
  // ---------------------------------------------------------

  let averageDaysBetweenPayments = 0;

  if (payments.length >= 2) {
    let totalDays = 0;

    for (let i = 1; i < payments.length; i++) {
      const previousDate = new Date(
        payments[i - 1].createdAt
      );

      const currentDate = new Date(
        payments[i].createdAt
      );

      const difference =
        currentDate.getTime() -
        previousDate.getTime();

      const days =
        difference / (1000 * 60 * 60 * 24);

      totalDays += days;
    }

    averageDaysBetweenPayments =
      totalDays / (payments.length - 1);
  }

  // ---------------------------------------------------------
  // REPAYMENT PROGRESS
  // ---------------------------------------------------------

  const repaymentProgress =
    totalCredits > 0
      ? Math.min(
          (totalPayments / totalCredits) * 100,
          100
        )
      : 0;

  // ---------------------------------------------------------
  // FORMAT FREQUENCY
  // ---------------------------------------------------------

  function formatFrequency() {
    if (payments.length === 0) {
      return "No payments";
    }

    if (payments.length === 1) {
      return "First payment";
    }

    if (averageDaysBetweenPayments < 1) {
      return "Daily";
    }

    const roundedDays = Math.round(
      averageDaysBetweenPayments
    );

    return `Every ${roundedDays}d`;
  }

  // ---------------------------------------------------------
  // CURRENCY
  // ---------------------------------------------------------

  function formatCurrency(amount: number) {
    return `৳${Math.round(
      amount
    ).toLocaleString("en-BD")}`;
  }

  // ---------------------------------------------------------
  // EMPTY STATE
  // ---------------------------------------------------------

  if (transactions.length === 0) {
    return (
      <section className="mt-7 sm:mt-9">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:rounded-3xl sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Payment Behavior
              </h2>

              <p className="text-xs text-slate-500">
                Customer payment patterns and repayment progress.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <Wallet className="mx-auto h-7 w-7 text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Not enough transaction data
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Payment behavior will appear after transactions are recorded.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-7 sm:mt-9">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">

        {/* HEADER */}

        <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Payment Behavior
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                Customer payment patterns and repayment progress.
              </p>
            </div>

          </div>
        </div>

        {/* STATISTICS */}

        <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-4 sm:divide-y-0">

          {/* FREQUENCY */}

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-500" />

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Frequency
              </p>
            </div>

            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
              {formatFrequency()}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Average between payments
            </p>
          </div>

          {/* AVERAGE */}

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Average
              </p>
            </div>

            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
              {formatCurrency(averagePayment)}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Average payment amount
            </p>
          </div>

          {/* LARGEST */}

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-500" />

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Largest
              </p>
            </div>

            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
              {formatCurrency(largestPayment)}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Largest recorded payment
            </p>
          </div>

          {/* TRANSACTIONS */}

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-slate-500" />

              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Transactions
              </p>
            </div>

            <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
              {payments.length}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Total payments recorded
            </p>
          </div>

        </div>

        {/* REPAYMENT PROGRESS */}

        <div className="border-t border-slate-100 px-5 py-5 sm:px-7 sm:py-6">

          <div className="flex items-end justify-between gap-4">

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Credit repayment progress
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {formatCurrency(totalPayments)} paid of{" "}
                {formatCurrency(totalCredits)} credited
              </p>
            </div>

            <p className="text-lg font-bold text-slate-900">
              {Math.round(repaymentProgress)}%
            </p>

          </div>

          {/* PROGRESS BAR */}

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
              style={{
                width: `${repaymentProgress}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>
              Total credited: {formatCurrency(totalCredits)}
            </span>

            <span>
              Total paid: {formatCurrency(totalPayments)}
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}