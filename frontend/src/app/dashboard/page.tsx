"use client";

import { useEffect, useState } from "react";

import { CreditCard, Users, Wallet, AlertCircle } from "lucide-react";
import { getDashboardStats, DashboardStats } from "@/lib/dashboard";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import AIInsights from "@/components/dashboard/AIInsights";

const demoTransactions = [
  {
    _id: "1",
    customerName: "Rahim Ahmed",
    type: "CREDIT" as const,
    amount: 500,
    description: "Rice and groceries",
    transactionDate: new Date().toISOString(),
  },
  {
    _id: "2",
    customerName: "Karim Hasan",
    type: "PAYMENT" as const,
    amount: 300,
    description: "Partial payment",
    transactionDate: new Date().toISOString(),
  },
  {
    _id: "3",
    customerName: "Hasan Ali",
    type: "CREDIT" as const,
    amount: 800,
    description: "Monthly groceries",
    transactionDate: new Date().toISOString(),
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardStats();

        setStats(data);
      } catch (error) {
        console.error(error);

        setError("Unable to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />

            <p className="mt-4 text-sm text-zinc-500">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">Something went wrong</h2>

          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">
            Tuesday, August 25, 2026
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Good morning, Junak 👋
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Customers"
            value={stats ? stats.totalCustomers.toLocaleString() : "—"}
            description="Registered customers"
            icon={Users}
          />

          <StatCard
            title="Total Baki"
            value={stats ? `৳${stats.totalBaki.toLocaleString()}` : "—"}
            description="Outstanding balance"
            icon={Wallet}
          />

          <StatCard
            title="Collected"
            value={stats ? `৳${stats.totalPayment.toLocaleString()}` : "—"}
            description="Total payments received"
            icon={CreditCard}
          />

          <StatCard
            title="Total Credit"
            value={stats ? `৳${stats.totalCredit.toLocaleString()}` : "—"}
            description="Credit given to customers"
            icon={AlertCircle}
          />
        </div>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {/* Chart placeholder */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div>
              <h2 className="font-semibold text-zinc-900">Baki Overview</h2>

              <p className="mt-1 text-xs text-zinc-400">
                Credit and payment activity
              </p>
            </div>

            <div className="mt-8 flex h-64 items-end gap-3">
              {[35, 52, 45, 70, 58, 82, 64, 90, 72, 96, 78, 88].map(
                (height, index) => (
                  <div key={index} className="flex flex-1 items-end">
                    <div
                      style={{
                        height: `${height}%`,
                      }}
                      className="w-full rounded-t-lg bg-zinc-900/90 transition hover:bg-zinc-700"
                    />
                  </div>
                ),
              )}
            </div>

            <div className="mt-4 flex justify-between text-xs text-zinc-400">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>

          {/* AI */}
          <AIInsights overdueCustomers={5} highRiskCustomers={3} />
        </div>

        {/* Transactions */}
        <div className="mt-6">
          <RecentTransactions transactions={demoTransactions} />
        </div>
      </div>
    </DashboardLayout>
  );
}
