"use client";

import { useState } from "react";

import { useI18n } from "@/i18n/I18nProvider";
import type { MonthlyReport } from "@/lib/business";

/*
 * Two series on one taka axis: Baki given (amber, striped) and collected (emerald).
 * The pair is validated (dataviz validator: normal-vision ΔE 23.7, protan ΔE 7.9),
 * so colour is never the only cue: "given" is always the left bar and striped,
 * there's a legend, a per-day tooltip, and a table view.
 */
const GIVEN = "#d97706";
const COLLECTED = "#059669";
const STRIPES = `repeating-linear-gradient(45deg, ${GIVEN} 0 3px, #f59e0b 3px 5px)`;

export default function DailyChart({ daily }: { daily: MonthlyReport["daily"] }) {
  const { t, money, number } = useI18n();
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(1, ...daily.flatMap((day) => [day.credit, day.payment]));
  const hasData = daily.some((day) => day.credit > 0 || day.payment > 0);
  const point = active !== null ? daily[active] : null;

  const dayLabel = (date: string) => number(Number(date.slice(8, 10)));

  return (
    <div>
      {/* Legend (always present for two series) */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: STRIPES }} aria-hidden />
          {t("reports.dailyGiven")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: COLLECTED }} aria-hidden />
          {t("reports.dailyCollected")}
        </span>
      </div>

      <div className="relative mt-3 overflow-x-auto">
        <div className="relative min-w-150">
          {/* Recessive grid: top and middle */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48">
            {[0, 0.5].map((fraction) => (
              <div
                key={fraction}
                className="absolute inset-x-0 border-t border-dashed border-slate-200"
                style={{ top: `${fraction * 100}%` }}
              >
                <span className="absolute -top-2 right-0 bg-white pl-1 text-[10px] text-slate-400">
                  {money(Math.round(max * (1 - fraction)))}
                </span>
              </div>
            ))}
          </div>

          <div className="flex h-48 items-end gap-0.5 border-b border-slate-300" role="list">
            {daily.map((day, index) => (
              <button
                key={day.date}
                type="button"
                role="listitem"
                aria-label={`${day.date}: ${t("reports.dailyGiven")} ${money(day.credit)}, ${t("reports.dailyCollected")} ${money(day.payment)}`}
                onPointerEnter={() => setActive(index)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                className={`flex h-full flex-1 items-end justify-center gap-0.5 rounded-sm outline-none transition focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  active === index ? "bg-slate-100" : ""
                }`}
              >
                <span
                  className="w-[38%] rounded-t-[3px]"
                  style={{ height: `${(day.credit / max) * 100}%`, background: STRIPES, minHeight: day.credit > 0 ? 2 : 0 }}
                />
                <span
                  className="w-[38%] rounded-t-[3px]"
                  style={{ height: `${(day.payment / max) * 100}%`, background: COLLECTED, minHeight: day.payment > 0 ? 2 : 0 }}
                />
              </button>
            ))}
          </div>

          {/* Day numbers: every 5th to avoid crowding */}
          <div className="mt-1 flex gap-0.5">
            {daily.map((day, index) => (
              <span key={day.date} className="flex-1 text-center text-[10px] text-slate-400">
                {index === 0 || (index + 1) % 5 === 0 ? dayLabel(day.date) : ""}
              </span>
            ))}
          </div>

          {/* Tooltip: values lead, labels follow */}
          {point && active !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 w-44 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg"
              style={{ left: `clamp(0px, calc(${(active / daily.length) * 100}% - 88px), calc(100% - 176px))` }}
            >
              <p className="font-semibold text-slate-500">{point.date}</p>
              <p className="mt-1.5 flex items-center gap-2">
                <span className="h-0.5 w-3" style={{ background: GIVEN }} />
                <strong className="text-slate-900">{money(point.credit)}</strong>
                <span className="text-slate-500">{t("reports.dailyGiven")}</span>
              </p>
              <p className="mt-1 flex items-center gap-2">
                <span className="h-0.5 w-3" style={{ background: COLLECTED }} />
                <strong className="text-slate-900">{money(point.payment)}</strong>
                <span className="text-slate-500">{t("reports.dailyCollected")}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Table view: every value without hovering or colour */}
      {hasData && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-slate-500">{t("reports.dailyTitle")}</summary>
          <table className="mt-2 w-full text-left">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-1 font-medium">#</th>
                <th className="py-1 text-right font-medium">{t("reports.dailyGiven")}</th>
                <th className="py-1 text-right font-medium">{t("reports.dailyCollected")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daily
                .filter((day) => day.credit > 0 || day.payment > 0)
                .map((day) => (
                  <tr key={day.date}>
                    <td className="py-1.5 text-slate-600">{day.date}</td>
                    <td className="py-1.5 text-right text-slate-900">{money(day.credit)}</td>
                    <td className="py-1.5 text-right text-slate-900">{money(day.payment)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
