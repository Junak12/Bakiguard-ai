"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Loader2 } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import RemindButtons from "@/components/reminders/RemindButtons";
import { useI18n } from "@/i18n/I18nProvider";
import { getCollections, type CollectionItem, type CollectionSummary } from "@/lib/collections";

const WINDOWS = [0, 3, 7];

export default function CollectionsPage() {
  return (
    <DashboardLayout>
      <Collections />
    </DashboardLayout>
  );
}

function Collections() {
  const { t, money, number } = useI18n();

  const [days, setDays] = useState(3);
  const [items, setItems] = useState<CollectionItem[] | null>(null);
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    getCollections(days)
      .then((result) => {
        if (!active) return;
        setItems(result.data);
        setSummary(result.summary);
        setError(false);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [days, reloadKey]);

  /** Marks a customer as reminded right away (the server log happens in the background). */
  function markReminded(customerId: string) {
    setItems((current) =>
      current?.map((item) =>
        item.customer._id === customerId
          ? { ...item, remindedRecently: true, customer: { ...item.customer, lastRemindedAt: new Date().toISOString() } }
          : item
      ) ?? null
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("collections.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("collections.subtitle")}</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{t("collections.summaryToCollect")}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{money(summary.totalToCollect)}</p>
            <p className="text-xs text-slate-400">
              {t("collections.summaryCustomers", { count: number(summary.count) })}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 shadow-sm">
            <p className="text-xs text-rose-700">{t("collections.summaryOverdue")}</p>
            <p className="mt-1 text-xl font-bold text-rose-800">{money(summary.totalOverdue)}</p>
            <p className="text-xs text-rose-600/80">
              {t("collections.summaryReminded", { count: number(items?.filter((i) => i.remindedRecently).length ?? 0) })}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-500">{t("collections.windowLabel")}</span>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {WINDOWS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={days === option}
              onClick={() => {
                setLoading(true);
                setDays(option);
              }}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                days === option ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {t("collections.windowDays", { days: number(option) })}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {t("collections.loadError")}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadKey((key) => key + 1);
            }}
            className="font-semibold underline"
          >
            {t("common.retry")}
          </button>
        </div>
      ) : !items ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-6 py-14 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <h2 className="mt-3 font-semibold text-emerald-900">{t("collections.emptyTitle")}</h2>
          <p className="mt-1 text-sm text-emerald-800">{t("collections.emptyText")}</p>
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => (
            <li
              key={item.customer._id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition sm:p-5 ${
                item.remindedRecently ? "border-slate-200 opacity-70" : "border-slate-200"
              }`}
            >
              <Link href={`/customers/${item.customer._id}`} className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    item.status === "overdue" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {number(index + 1)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{item.customer.name}</p>
                  <p
                    className={`text-sm font-medium ${
                      item.status === "overdue" ? "text-rose-600" : "text-amber-700"
                    }`}
                  >
                    {item.status === "overdue"
                      ? t("collections.lateBy", { days: number(item.daysLate) })
                      : item.dueInDays === 0
                        ? t("collections.dueToday")
                        : t("collections.dueIn", { days: number(item.dueInDays) })}
                    {item.status === "overdue" && item.overdueAmount < item.customer.totalDue && (
                      <span className="font-normal text-slate-500">
                        {" · "}
                        {t("collections.overdueOf", { amount: money(item.overdueAmount) })}
                      </span>
                    )}
                  </p>
                  {item.remindedRecently && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t("collections.remindedToday")}
                    </p>
                  )}
                </div>

                <p className="shrink-0 text-lg font-bold text-slate-900">{money(item.customer.totalDue)}</p>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
              </Link>

              <div className="mt-4">
                <RemindButtons
                  customer={item.customer}
                  overdueAmount={item.overdueAmount}
                  onReminded={() => markReminded(item.customer._id)}
                  size="sm"
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
