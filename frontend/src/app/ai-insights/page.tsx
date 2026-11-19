"use client";

import { useEffect, useState } from "react";

import AgingCard from "@/components/dashboard/AgingCard";
import AIInsights from "@/components/dashboard/AIInsights";
import OverdueCustomers from "@/components/dashboard/OverdueCustomers";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { getDashboardAIInsights, type AIDashboardInsights } from "@/lib/ai";
import { getCustomers } from "@/lib/customer";
import { getAgingReport, type AgingReport } from "@/lib/dashboard";
import type { Customer } from "@/types/customer";

export default function AIInsightsPage() {
  return (
    <DashboardLayout>
      <Insights />
    </DashboardLayout>
  );
}

function Insights() {
  const { t } = useI18n();

  const [ai, setAi] = useState<AIDashboardInsights | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiFailed, setAiFailed] = useState(false);
  const [aging, setAging] = useState<AgingReport | null>(null);
  const [overdue, setOverdue] = useState<Customer[] | null>(null);

  useEffect(() => {
    getDashboardAIInsights()
      .then(setAi)
      .catch(() => setAiFailed(true))
      .finally(() => setAiLoading(false));

    getAgingReport().then(setAging).catch(() => undefined);

    getCustomers({ status: "overdue" })
      .then(setOverdue)
      .catch(() => setOverdue([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("ai.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("ai.pageSubtitle")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <AIInsights data={ai} loading={aiLoading} failed={aiFailed} />
        </div>

        <div className="space-y-6">
          <OverdueCustomers customers={overdue} />
          <AgingCard report={aging} />
        </div>
      </div>
    </div>
  );
}
