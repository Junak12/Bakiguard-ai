"use client";

import { Loader2 } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import type { Transaction } from "@/types/transaction";

import TransactionItem from "./TransactionItem";

interface Props {
  transactions: Transaction[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export default function CustomerTransactions({ transactions, hasMore, loadingMore, onLoadMore }: Props) {
  const { t } = useI18n();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-bold text-slate-900">{t("customers.history.title")}</h2>
        <p className="text-xs text-slate-500">{t("customers.history.subtitle")}</p>
      </div>

      {transactions.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">{t("customers.history.empty")}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {transactions.map((transaction) => (
            <TransactionItem key={transaction._id} transaction={transaction} />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="flex w-full items-center justify-center gap-2 border-t border-slate-100 py-4 text-sm font-semibold text-emerald-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
          {loadingMore ? t("customers.history.loadingMore") : t("customers.history.loadMore")}
        </button>
      )}
    </section>
  );
}
