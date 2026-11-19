"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  getDashboardAIInsights,
  AIDashboardInsights,
} from "@/lib/ai";

import {
  CreditCard,
  Users,
  Wallet,
  AlertCircle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Zap,
  ArrowUpRight,
} from "lucide-react";

import {
  getDashboardStats,
  DashboardStats,
} from "@/lib/dashboard";

import {
  DASHBOARD_UPDATED,
} from "@/lib/dashboard-events";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import AIInsights from "@/components/dashboard/AIInsights";

/* ============================================================
   DEMO TRANSACTIONS
   ============================================================ */

const demoTransactions = [
  {
    _id: "1",
    customerName: "Rahim Ahmed",
    type: "CREDIT" as const,
    amount: 500,
    description: "Rice and groceries",
    transactionDate:
      new Date().toISOString(),
  },
  {
    _id: "2",
    customerName: "Karim Hasan",
    type: "PAYMENT" as const,
    amount: 300,
    description: "Partial payment",
    transactionDate:
      new Date().toISOString(),
  },
  {
    _id: "3",
    customerName: "Hasan Ali",
    type: "CREDIT" as const,
    amount: 800,
    description: "Monthly groceries",
    transactionDate:
      new Date().toISOString(),
  },
];

/* ============================================================
   MOCK CHART DATA
   ============================================================ */

const mockChartData = [
  {
    month: "Jan",
    val: 35,
    color: "from-cyan-500 to-blue-600",
  },
  {
    month: "Feb",
    val: 52,
    color: "from-blue-500 to-indigo-600",
  },
  {
    month: "Mar",
    val: 45,
    color: "from-indigo-500 to-violet-600",
  },
  {
    month: "Apr",
    val: 70,
    color: "from-violet-500 to-purple-600",
  },
  {
    month: "May",
    val: 58,
    color: "from-purple-500 to-fuchsia-600",
  },
  {
    month: "Jun",
    val: 82,
    color: "from-fuchsia-500 to-pink-600",
  },
  {
    month: "Jul",
    val: 64,
    color: "from-pink-500 to-rose-600",
  },
  {
    month: "Aug",
    val: 90,
    color: "from-rose-500 to-orange-500",
  },
  {
    month: "Sep",
    val: 72,
    color: "from-amber-500 to-emerald-500",
  },
  {
    month: "Oct",
    val: 96,
    color: "from-emerald-400 to-teal-600",
  },
  {
    month: "Nov",
    val: 78,
    color: "from-teal-500 to-cyan-600",
  },
  {
    month: "Dec",
    val: 88,
    color: "from-sky-500 to-indigo-600",
  },
];

/* ============================================================
   DASHBOARD PAGE
   ============================================================ */

export default function DashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [aiData, setAiData] =
  useState<AIDashboardInsights | null>(null);

const [aiLoading, setAiLoading] =
  useState(true);

const [aiError, setAiError] =
  useState("");

  /* ==========================================================
     LOAD DASHBOARD STATS
     ========================================================== */

  const loadDashboard = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const data =
          await getDashboardStats();

        setStats(data);
      } catch (error) {
        console.error(
          "Dashboard stats error:",
          error
        );

        setError(
          "Unable to load dashboard statistics"
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  /* ==========================================================
     INITIAL LOAD + DASHBOARD UPDATE LISTENER
     ========================================================== */

  useEffect(() => {
    // Initial dashboard load
    loadDashboard(true);

    // Refresh dashboard whenever customer,
    // credit or payment data changes.
    const handleDashboardUpdate = () => {
      loadDashboard(false);
    };

    window.addEventListener(
      DASHBOARD_UPDATED,
      handleDashboardUpdate
    );

    return () => {
      window.removeEventListener(
        DASHBOARD_UPDATED,
        handleDashboardUpdate
      );
    };
  }, [loadDashboard]);

  /* ==========================================================
     LOADING STATE
     ========================================================== */
  useEffect(() => {
  async function loadAIInsights() {
    try {
      setAiLoading(true);
      setAiError("");

      const data =
        await getDashboardAIInsights();

      setAiData(data);
    } catch (error) {
      console.error(
        "AI insights error:",
        error
      );

      setAiError(
        "Unable to generate AI insights"
      );
    } finally {
      setAiLoading(false);
    }
  }

  loadAIInsights();
}, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="relative flex items-center justify-center">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600 sm:h-16 sm:w-16" />

            <Sparkles className="absolute h-5 w-5 animate-pulse text-amber-500 sm:h-6 sm:w-6" />
          </div>

          <p className="mt-5 text-center text-sm font-semibold text-slate-700 sm:mt-6 sm:text-base">
            Synthesizing intelligence & stats...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  /* ==========================================================
     ERROR STATE
     ========================================================== */

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-4 max-w-lg rounded-3xl border border-rose-200/70 bg-gradient-to-b from-rose-50/80 to-white p-6 text-center shadow-xl backdrop-blur-md sm:mx-auto sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 sm:h-14 sm:w-14">
            <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900 sm:text-xl">
            Sync Encountered An Error
          </h2>

          <p className="mt-1.5 text-sm text-slate-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              loadDashboard(true);
            }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition duration-200 hover:scale-[1.02] hover:shadow-rose-500/40 active:scale-95 sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />

            Reload Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  /* ==========================================================
     DASHBOARD
     ========================================================== */

  return (
    <DashboardLayout>
      <div className="relative space-y-5 overflow-hidden pb-8 sm:space-y-6 sm:pb-10 lg:space-y-8 lg:pb-12">
        {/* =====================================================
            AMBIENT BACKGROUND
        ===================================================== */}

        <div className="pointer-events-none absolute -top-10 left-1/4 -z-10 h-48 w-48 rounded-full bg-violet-400/20 blur-[80px] sm:h-72 sm:w-72 sm:blur-[100px]" />

        <div className="pointer-events-none absolute right-0 top-40 -z-10 h-56 w-56 rounded-full bg-cyan-400/20 blur-[90px] sm:right-10 sm:h-80 sm:w-80 sm:blur-[120px]" />

        <div className="pointer-events-none absolute bottom-10 left-0 -z-10 h-64 w-64 rounded-full bg-pink-400/15 blur-[100px] sm:left-10 sm:h-96 sm:w-96 sm:blur-[140px]" />

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-r from-indigo-900 via-violet-900 to-purple-950 p-5 text-white shadow-xl shadow-indigo-950/10 sm:rounded-3xl sm:p-6 md:p-7 lg:p-8">
          <div className="absolute right-0 top-0 -mr-20 -mt-20 h-48 w-48 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 blur-2xl sm:h-64 sm:w-64" />

          <div className="relative z-10 flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Hero content */}

            <div className="min-w-0">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold backdrop-blur-md sm:text-xs">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>

                <span className="truncate">
                  LIVE SYSTEM • Thursday, August 27, 2026
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                Good morning,{" "}
                <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
                  Junak
                </span>{" "}
                👋
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-5 text-violet-200/90 sm:text-sm sm:leading-6">
                Your business metrics are active.
                Here is today's real-time breakdown
                of transactions, outstanding credit,
                and collection analytics.
              </p>
            </div>

            {/* System health */}

            <div className="w-full shrink-0 sm:w-fit">
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md sm:p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 shadow-md sm:h-10 sm:w-10">
                  <Zap className="h-4 w-4 fill-current sm:h-5 sm:w-5" />
                </div>

                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-200 sm:text-[10px]">
                    System Health
                  </p>

                  <p className="text-xs font-bold text-emerald-400 sm:text-sm">
                    Optimal (99.8%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {/* Total Customers */}

          <div className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 sm:rounded-3xl sm:p-5 lg:p-6">
            <StatCard
              title="Total Customers"
              value={
                stats
                  ? stats.totalCustomers.toLocaleString()
                  : "—"
              }
              description="Active registered accounts"
              icon={Users}
            />

            <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-indigo-500/10 blur-xl transition-all group-hover:bg-indigo-500/20 sm:h-24 sm:w-24" />
          </div>

          {/* Total Baki */}

          <div className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/10 sm:rounded-3xl sm:p-5 lg:p-6">
            <StatCard
              title="Total Baki"
              value={
                stats
                  ? `৳${stats.totalBaki.toLocaleString()}`
                  : "—"
              }
              description="Outstanding customer balance"
              icon={Wallet}
            />

            <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-rose-500/10 blur-xl transition-all group-hover:bg-rose-500/20 sm:h-24 sm:w-24" />
          </div>

          {/* Collected */}

          <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 sm:rounded-3xl sm:p-5 lg:p-6">
            <StatCard
              title="Collected"
              value={
                stats
                  ? `৳${stats.totalPayment.toLocaleString()}`
                  : "—"
              }
              description="Total payment volume"
              icon={CreditCard}
            />

            <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/10 blur-xl transition-all group-hover:bg-emerald-500/20 sm:h-24 sm:w-24" />
          </div>

          {/* Total Credit */}

          <div className="group relative overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/30 to-sky-50/50 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-500/10 sm:rounded-3xl sm:p-5 lg:rounded-3xl lg:p-6">
            <StatCard
              title="Total Credit"
              value={
                stats
                  ? `৳${stats.totalCredit.toLocaleString()}`
                  : "—"
              }
              description="Lifetime credit issued"
              icon={AlertCircle}
            />

            <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-cyan-500/10 blur-xl transition-all group-hover:bg-cyan-500/20 sm:h-24 sm:w-24" />
          </div>
        </section>

        {/* =====================================================
            CHART + AI
        ===================================================== */}

        <section className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-3">
          {/* Chart */}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl transition-all hover:shadow-md sm:rounded-3xl sm:p-6 lg:p-7 xl:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    Baki & Volume Spectrum
                  </h2>

                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[9px] font-extrabold text-violet-700 sm:text-[10px]">
                    ANNUAL
                  </span>
                </div>

                <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500 sm:text-xs">
                  Monthly track of extended credit vs
                  aggregate collection ratio
                </p>
              </div>

              <div className="flex w-fit shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200/50 bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 sm:rounded-2xl sm:px-3.5 sm:text-xs">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />

                <span>+12.5% Growth</span>

                <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </div>

            {/* Chart */}

            <div className="mt-6 overflow-x-auto pb-1 sm:mt-8">
              <div className="min-w-[560px]">
                <div className="flex h-52 items-end gap-2 sm:h-64 sm:gap-3 md:h-72">
                  {mockChartData.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                      >
                        {/* Tooltip */}

                        <div className="pointer-events-none absolute -top-8 z-20 opacity-0 transition-all duration-200 group-hover:-top-9 group-hover:opacity-100">
                          <div className="flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-white shadow-xl sm:text-[11px]">
                            <span>
                              {item.val}%
                            </span>
                          </div>
                        </div>

                        {/* Bar background */}

                        <div className="flex h-full w-full items-end rounded-xl bg-slate-100/70 p-1 transition-all duration-300 group-hover:bg-slate-200/50 sm:rounded-2xl">
                          <div
                            style={{
                              height: `${item.val}%`,
                            }}
                            className={`w-full rounded-lg bg-gradient-to-t ${item.color} shadow-lg shadow-indigo-500/10 transition-all duration-500 group-hover:brightness-110 group-hover:shadow-indigo-500/30 sm:rounded-xl`}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* X axis */}

                <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-400 sm:mt-4 sm:text-xs">
                  {mockChartData.map(
                    (item) => (
                      <span key={item.month}>
                        {item.month}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights */}

          <div className="min-w-0 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-b from-white via-violet-50/20 to-white shadow-sm sm:rounded-3xl">
<div className="min-w-0 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-b from-white via-violet-50/20 to-white shadow-sm sm:rounded-3xl">
  {aiLoading ? (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
        <Sparkles className="h-6 w-6 animate-pulse text-violet-600" />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800">
        Analyzing your business...
      </p>

      <p className="mt-1 text-xs text-slate-500">
        AI is reviewing your customers and transactions.
      </p>
    </div>
  ) : aiError ? (
    <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="h-8 w-8 text-rose-500" />

      <p className="mt-3 text-sm font-semibold text-slate-800">
        AI analysis unavailable
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {aiError}
      </p>
    </div>
  ) : (
    <AIInsights
      insights={aiData?.insights ?? []}
    />
  )}
</div>
          </div>
        </section>

        {/* =====================================================
            RECENT TRANSACTIONS
        ===================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md sm:rounded-3xl sm:p-5 lg:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                Recent Transactions Activity
              </h3>

              <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                Latest credit and payment activity
              </p>
            </div>

            <button
              type="button"
              className="w-fit text-xs font-semibold text-violet-600 transition hover:text-violet-800 hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[600px]">
              <RecentTransactions
                transactions={demoTransactions}
              />
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}