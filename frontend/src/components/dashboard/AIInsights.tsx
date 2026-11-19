"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  User,
} from "lucide-react";

interface AIInsight {
  type:
    | "warning"
    | "customer"
    | "positive"
    | "info";

  title: string;

  message: string;

  customer?: string;
}

interface AIInsightsProps {
  insights: AIInsight[];
}

export default function AIInsights({
  insights,
}: AIInsightsProps) {
  function getIcon(type: AIInsight["type"]) {
    switch (type) {
      case "warning":
        return (
          <AlertTriangle className="h-4 w-4" />
        );

      case "customer":
        return (
          <User className="h-4 w-4" />
        );

      case "positive":
        return (
          <CheckCircle2 className="h-4 w-4" />
        );

      default:
        return (
          <Info className="h-4 w-4" />
        );
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}

      <div className="border-b border-violet-100 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              AI Business Insights
            </h2>

            <p className="text-[10px] text-slate-500 sm:text-xs">
              Intelligent analysis of your business
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}

      <div className="flex-1 space-y-3 p-4 sm:p-5">
        {insights.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-800">
              Everything looks good
            </p>

            <p className="mt-1 text-xs text-slate-500">
              No important issues detected.
            </p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:shadow-md sm:p-4"
            >
              <div className="flex gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    insight.type === "warning"
                      ? "bg-amber-50 text-amber-600"
                      : insight.type === "customer"
                      ? "bg-violet-50 text-violet-600"
                      : insight.type === "positive"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {getIcon(insight.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-900 sm:text-sm">
                    {insight.title}
                  </h3>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
                    {insight.message}
                  </p>

                  {insight.customer && (
                    <div className="mt-2 inline-flex rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                      Customer: {insight.customer}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}

      <div className="border-t border-violet-100 bg-violet-50/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="text-[10px] font-semibold text-slate-500">
            AI analysis based on your latest business data
          </span>
        </div>
      </div>
    </div>
  );
}