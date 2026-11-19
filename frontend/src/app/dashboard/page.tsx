"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlarmClock, HandCoins, UserPlus, Users, Wallet } from "lucide-react";

import AgingCard from "@/components/dashboard/AgingCard";
import AIInsights from "@/components/dashboard/AIInsights";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import StatCard from "@/components/dashboard/StatCard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import { getDashboardAIInsights, type AIDashboardInsights } from "@/lib/ai";
import { DASHBOARD_UPDATED } from "@/lib/dashboard-events";
import {
  getAgingReport,
  getDashboardStats,
  type AgingReport,
  type DashboardStats,
} from "@/lib/dashboard";
import { getTransactions } from "@/services/transaction.service";
import type { Transaction } from "@/types/transaction";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}

/** Stats, aging and recent activity in one round. Null on failure. */
async function fetchDashboard() {
  try {
    const [stats, aging, recent] = await Promise.all([
      getDashboardStats(),
      getAgingReport(),
      getTransactions({ page: 1, limit: 6 }),
    ]);

    return { stats, aging, recent: recent.data };
  } catch {
    return null;
  }
}

function greetingKey(hour: number) {
  if (hour < 12) return "dashboard.greetingMorning" as const;
  if (hour < 17) return "dashboard.greetingAfternoon" as const;
  return "dashboard.greetingEvening" as const;
}

function Dashboard() {
  const { t, money, number, date } = useI18n();
  const user = useSessionUser();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [aging, setAging] = useState<AgingReport | null>(null);
  const [recent, setRecent] = useState<Transaction[] | null>(null);
  const [error, setError] = useState(false);

  const [ai, setAi] = useState<AIDashboardInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiFailed, setAiFailed] = useState(false);

  const applyData = useCallback((result: Awaited<ReturnType<typeof fetchDashboard>>) => {
    if (result) {
      setStats(result.stats);
      setAging(result.aging);
      setRecent(result.recent);
    }
    setError(!result);
  }, []);

  const applyAi = useCallback((result: AIDashboardInsights | null) => {
    setAi(result);
    setAiFailed(!result);
    setAiLoading(false);
  }, []);

  const load = useCallback(async () => applyData(await fetchDashboard()), [applyData]);

  useEffect(() => {
    let active = true;

    const refresh = () => {
      fetchDashboard().then((result) => active && applyData(result));
      getDashboardAIInsights()
        .catch(() => null)
        .then((result) => active && applyAi(result));
    };

    refresh();

    // Refresh after a customer, credit or payment changes elsewhere.
    window.addEventListener(DASHBOARD_UPDATED, refresh);

    return () => {
      active = false;
      window.removeEventListener(DASHBOARD_UPDATED, refresh);
    };
  }, [applyData, applyAi]);

  const now = new Date();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">{date(now)}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            {t(greetingKey(now.getHours()), { name: firstName })}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("dashboard.subtitle")}</p>
        </div>

        <Link
          href="/customers/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" /> {t("dashboard.addCustomer")}
        </Link>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {t("dashboard.loadError")}
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            {t("common.retry")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          title={t("dashboard.stats.totalBaki")}
          value={stats ? money(stats.totalBaki) : "—"}
          description={t("dashboard.stats.totalBakiHint")}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          title={t("dashboard.stats.overdue")}
          value={aging ? money(aging.totalOverdue) : "—"}
          description={
            aging && aging.overdueCustomers > 0
              ? t("dashboard.stats.overdueHint", { count: number(aging.overdueCustomers) })
              : t("dashboard.stats.overdueNone")
          }
          icon={AlarmClock}
          tone={aging && aging.totalOverdue > 0 ? "danger" : "neutral"}
        />
        <StatCard
          title={t("dashboard.stats.collected")}
          value={stats ? money(stats.totalPayment) : "—"}
          description={t("dashboard.stats.collectedHint")}
          icon={HandCoins}
          tone="success"
        />
        <StatCard
          title={t("dashboard.stats.customers")}
          value={stats ? number(stats.totalCustomers) : "—"}
          description={t("dashboard.stats.customersHint")}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <AgingCard report={aging} />
          <RecentTransactions transactions={recent} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <AIInsights data={ai} loading={aiLoading} failed={aiFailed} />
        </div>
      </div>
    </div>
  );
}
