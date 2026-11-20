"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Lock, Printer } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import NoPermission from "@/components/layout/NoPermission";
import { usePermissions } from "@/hooks/usePermissions";
import DailyChart from "@/components/reports/DailyChart";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import { downloadMonthCsv, getMonthlyReport, type MonthlyReport } from "@/lib/business";
import { toastError } from "@/lib/toast";

function thisMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number) {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(year, index - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <Guarded />
    </DashboardLayout>
  );
}

function Guarded() {
  const permissions = usePermissions();
  return permissions.canSeeReports ? <Reports /> : <NoPermission />;
}

function Reports() {
  const { t, money, number, lang } = useI18n();
  const user = useSessionUser();

  const [month, setMonth] = useState(thisMonth);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    getMonthlyReport(month)
      .then((data) => {
        if (!active) return;
        setReport(data);
        setFailed(false);
      })
      .catch(() => active && setFailed(true));

    return () => {
      active = false;
    };
  }, [month]);

  const monthLabel = new Date(`${month}-01T00:00:00`).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    month: "long",
    year: "numeric",
  });

  const isPro = user?.plan === "pro";
  const shown = report?.month === month ? report : null;

  async function download() {
    setDownloading(true);
    try {
      await downloadMonthCsv(month);
    } catch {
      toastError(t("common.somethingWrong"));
    } finally {
      setDownloading(false);
    }
  }

  const tiles = shown
    ? [
        { label: t("reports.opening"), value: money(shown.openingBaki), hint: null },
        {
          label: t("reports.given"),
          value: money(shown.creditGiven),
          hint: t("reports.givenCount", { count: number(shown.creditCount) }),
        },
        {
          label: t("reports.collected"),
          value: money(shown.collected),
          hint: t("reports.collectedCount", { count: number(shown.paymentCount) }),
        },
        {
          label: t("reports.closing"),
          value: money(shown.closingBaki),
          hint:
            shown.netChange > 0
              ? t("reports.netUp", { amount: money(shown.netChange) })
              : shown.netChange < 0
                ? t("reports.netDown", { amount: money(-shown.netChange) })
                : t("reports.netFlat"),
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("reports.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("reports.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            aria-label={t("reports.previous")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-36 text-center font-semibold text-slate-900">{monthLabel}</span>
          <button
            type="button"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            disabled={month >= thisMonth()}
            aria-label={t("reports.next")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <p className="hidden text-lg font-semibold print:block">
        {user?.shopName || user?.ownerName} · {monthLabel}
      </p>

      {failed ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{t("reports.loadError")}</p>
      ) : !shown ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-500">{tile.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{tile.value}</p>
                {tile.hint && <p className="mt-0.5 text-xs text-slate-400">{tile.hint}</p>}
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{t("reports.collectionRate")}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{number(shown.collectionRate)}%</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-600" style={{ width: `${shown.collectionRate}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-400">{t("reports.collectionRateHint")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{t("reports.newCustomers")}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{number(shown.newCustomers)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{t("reports.customersOwing")}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{number(shown.customersOwing)}</p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-slate-900">{t("reports.dailyTitle")}</h2>
            <DailyChart daily={shown.daily} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 p-5 font-bold text-slate-900">{t("reports.topTitle")}</h2>
            {shown.topDebtors.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">{t("reports.topEmpty")}</p>
            ) : (
              <ol className="divide-y divide-slate-100">
                {shown.topDebtors.map((debtor, index) => (
                  <li key={debtor.customerId}>
                    <Link href={`/customers/${debtor.customerId}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                      <span className="w-6 text-sm text-slate-400">{number(index + 1)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-900">{debtor.name}</span>
                        <span className="block text-xs text-slate-500">{debtor.phone}</span>
                      </span>
                      <span className="font-bold text-slate-900">{money(debtor.balance)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="flex flex-wrap gap-3 print:hidden">
            {isPro ? (
              <button
                type="button"
                onClick={() => void download()}
                disabled={downloading}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Download className="h-4 w-4" /> {t("reports.download")}
              </button>
            ) : (
              <Link
                href="/billing"
                className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-500"
              >
                <Lock className="h-4 w-4" /> {t("reports.proOnly")}
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <Printer className="h-4 w-4" /> {t("reports.print")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
