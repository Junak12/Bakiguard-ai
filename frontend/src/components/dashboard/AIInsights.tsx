"use client";

import { AlertTriangle, CheckCircle2, Info, Sparkles, User } from "lucide-react";

import { useI18n, type TranslationKey } from "@/i18n/I18nProvider";
import type { AIDashboardInsights, AIInsight } from "@/lib/ai";

const KNOWN_CODES = [
  "overdue_baki",
  "outstanding_baki",
  "top_customer",
  "payment_activity",
  "getting_started",
] as const;

const tone: Record<AIInsight["type"], string> = {
  warning: "bg-amber-50 text-amber-600",
  customer: "bg-violet-50 text-violet-600",
  positive: "bg-emerald-50 text-emerald-600",
  info: "bg-sky-50 text-sky-600",
};

const icon: Record<AIInsight["type"], typeof Info> = {
  warning: AlertTriangle,
  customer: User,
  positive: CheckCircle2,
  info: Info,
};

interface AIInsightsProps {
  data: AIDashboardInsights | null;
  loading: boolean;
  failed: boolean;
}

export default function AIInsights({ data, loading, failed }: AIInsightsProps) {
  const { t, money, number } = useI18n();

  /** Translates a known insight code; falls back to the English text. */
  function render(insight: AIInsight) {
    const code = KNOWN_CODES.find((known) => known === insight.code);

    if (!code) return { title: insight.title, message: insight.message };

    const params = insight.params ?? {};
    const vars = {
      ...params,
      amount: typeof params.amount === "number" ? money(params.amount) : "",
      count: typeof params.count === "number" ? number(params.count) : "",
    };

    return {
      title: t(`ai.insights.${code}.title` as TranslationKey),
      message: t(`ai.insights.${code}.message` as TranslationKey, vars),
    };
  }

  const unavailable = failed || (data && !data.available);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-100 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{t("ai.title")}</h2>
          <p className="text-xs text-slate-500">{t("ai.subtitle")}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 p-4 sm:p-5">
        {loading ? (
          <div className="space-y-3" aria-label={t("ai.analyzing")}>
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : unavailable ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t("ai.unavailable")}</p>
        ) : !data || data.insights.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="mt-3 font-semibold text-slate-800">{t("ai.allGood")}</p>
            <p className="mt-1 text-sm text-slate-500">{t("ai.allGoodHint")}</p>
          </div>
        ) : (
          data.insights.map((insight, index) => {
            const Icon = icon[insight.type] ?? Info;
            const { title, message } = render(insight);

            return (
              <div key={`${insight.code}-${index}`} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone[insight.type] ?? tone.info}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">{t("ai.footer")}</p>
    </div>
  );
}
