"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useTransactions } from "@/hooks/transactions/useTransactions";
import { useI18n } from "@/i18n/I18nProvider";
import type { TransactionQuery } from "@/services/transaction.service";
import type { TransactionType } from "@/types/transaction";

type TypeFilter = "all" | TransactionType;
type Period = "all" | "today" | "week" | "month";

const PAGE_SIZE = 20;

/** Start of the period in the user's local time, as an ISO string. */
function periodStart(period: Period): string | undefined {
  if (period === "all") return undefined;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (period === "week") start.setDate(start.getDate() - 6);
  if (period === "month") start.setDate(1);

  return start.toISOString();
}

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <TransactionHistory />
    </DashboardLayout>
  );
}

function TransactionHistory() {
  const { t, money, number, dateTime } = useI18n();

  const [search, setSearch] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [period, setPeriod] = useState<Period>("all");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const query = useMemo<TransactionQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      type: type === "all" ? undefined : type,
      from: periodStart(period),
    }),
    [page, search, type, period]
  );

  const { transactions, pagination, loading, error } = useTransactions(query, reloadKey);

  const hasFilters = search.trim() !== "" || type !== "all" || period !== "all";

  function clearFilters() {
    setSearch("");
    setType("all");
    setPeriod("all");
    setPage(1);
  }

  const chip = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
    }`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("transactions.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("transactions.subtitle")}</p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("transactions.searchPlaceholder")}
            aria-label={t("transactions.searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(["all", "CREDIT", "PAYMENT"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={type === option}
                onClick={() => {
                  setType(option);
                  setPage(1);
                }}
                className={chip(type === option)}
              >
                {t(
                  option === "all"
                    ? "transactions.types.all"
                    : option === "CREDIT"
                      ? "transactions.types.credit"
                      : "transactions.types.payment"
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {(["all", "today", "week", "month"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={period === option}
                onClick={() => {
                  setPeriod(option);
                  setPage(1);
                }}
                className={`${chip(period === option)} whitespace-nowrap`}
              >
                {t(`transactions.periods.${option}`)}
              </button>
            ))}
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <X className="h-4 w-4" /> {t("transactions.clearFilters")}
            </button>
          )}

          <span className="ml-auto flex items-center gap-2 text-sm text-slate-500">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {pagination && t("transactions.total", { count: number(pagination.total) })}
          </span>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {t("transactions.loadError")}
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">
            {t("common.retry")}
          </button>
        </div>
      ) : !transactions ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((key) => (
            <div key={key} className="h-18 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm text-slate-500">
            {hasFilters ? t("transactions.emptyFiltered") : t("transactions.empty")}
          </p>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="mt-3 text-sm font-semibold text-emerald-700">
              {t("transactions.clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {transactions.map((transaction) => {
            const isCredit = transaction.type === "CREDIT";
            const customer = transaction.customerId;

            return (
              <li key={transaction._id}>
                <Link
                  href={customer?._id ? `/customers/${customer._id}` : "#"}
                  className="flex items-center gap-3 px-4 py-4 transition hover:bg-slate-50 sm:px-5"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isCredit ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {isCredit ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{customer?.name ?? "—"}</p>
                    <p className="truncate text-sm text-slate-500">
                      {transaction.description || t(isCredit ? "transactions.credit" : "transactions.payment")}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`font-bold ${isCredit ? "text-amber-600" : "text-emerald-600"}`}>
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

      {pagination && pagination.totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> {t("transactions.previous")}
          </button>

          <span className="text-sm text-slate-500">
            {t("transactions.pageOf", { page: number(pagination.page), total: number(pagination.totalPages) })}
          </span>

          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            disabled={page >= pagination.totalPages || loading}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"
          >
            {t("transactions.next")} <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
