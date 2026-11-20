"use client";

import { type FormEvent, useState } from "react";
import { Gauge, Loader2, Minus, Plus } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import { toAsciiDigits } from "@/i18n/format";
import { setCreditLimit, type CustomerRiskResult } from "@/lib/risk";
import { toastError, toastSuccess } from "@/lib/toast";

import RiskBadge, { BAND_STYLE } from "./RiskBadge";
import { useRiskText } from "./useRiskText";

interface Props {
  customerId: string;
  totalDue: number;
  result: CustomerRiskResult | null;
  failed: boolean;
  /** Reload risk after the owner changes the limit. */
  onChanged: () => void;
}

/** Score, plain-language reasons, and the credit limit (suggested or the owner's own). */
export default function RiskCard({ customerId, totalDue, result, failed, onChanged }: Props) {
  const { t, money, number } = useI18n();
  const { reasonText } = useRiskText();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const risk = result?.risk ?? null;
  const limit = result?.effectiveLimit ?? null;

  async function save(next: number | null) {
    setSaving(true);
    setError("");

    try {
      await setCreditLimit(customerId, next);
      toastSuccess(t("risk.limitSaved"));
      setEditing(false);
      onChanged();
    } catch {
      toastError(t("common.somethingWrong"));
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(toAsciiDigits(value).replace(/[,\s]/g, ""));

    if (!Number.isInteger(amount) || amount < 0) {
      setError(t("risk.limitInvalid"));
      return;
    }

    void save(amount);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <Gauge className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{t("risk.title")}</h2>
          <p className="text-xs text-slate-500">{t("risk.subtitle")}</p>
        </div>
      </div>

      {failed ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t("risk.unavailable")}</p>
      ) : !risk ? (
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <RiskBadge band={risk.band} className="px-3 py-1 text-sm" />
            {risk.band !== "new" && (
              <span className="text-sm font-semibold text-slate-600">
                {t("risk.score", { score: number(risk.score) })}
              </span>
            )}
          </div>

          {risk.band !== "new" && (
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${BAND_STYLE[risk.band].bar}`}
                style={{ width: `${Math.max(4, risk.score)}%` }}
              />
            </div>
          )}

          <p className="mt-3 text-sm text-slate-600">{t(`risk.bandHints.${risk.band}`)}</p>

          <ul className="mt-4 space-y-2">
            {risk.reasons.map((reason, index) => {
              const text = reasonText(reason);
              if (!text) return null;

              return (
                <li key={`${reason.code}-${index}`} className="flex items-start gap-2 text-sm text-slate-700">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      reason.impact > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {reason.impact > 0 ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  </span>
                  {text}
                </li>
              );
            })}
          </ul>

          {/* Credit limit */}
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{t("risk.limit")}</p>
                <p className="text-xl font-bold text-slate-900">{limit === null ? "—" : money(limit)}</p>
                <p className="text-xs text-slate-500">
                  {result?.creditLimit === null ? t("risk.usingSuggested") : t("risk.usingYours")}
                </p>
              </div>

              {limit !== null && (
                <p
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    totalDue > limit ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {totalDue > limit
                    ? t("risk.overLimit", { amount: money(totalDue - limit) })
                    : t("risk.available", { amount: money(limit - totalDue) })}
                </p>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {risk.suggestedLimit === 0
                ? t("risk.suggestedStop")
                : t("risk.suggested", { amount: money(risk.suggestedLimit) })}
            </p>

            {editing ? (
              <form onSubmit={submit} className="mt-3 flex gap-2" noValidate>
                <input
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  inputMode="numeric"
                  autoFocus
                  placeholder={t("risk.limitPlaceholder")}
                  aria-label={t("risk.yourLimit")}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("common.save")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-xl px-3 text-sm text-slate-500"
                >
                  {t("common.cancel")}
                </button>
              </form>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue(result?.creditLimit != null ? String(result.creditLimit) : "");
                    setEditing(true);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {result?.creditLimit === null ? t("risk.setLimit") : t("risk.editLimit")}
                </button>
                {result?.creditLimit !== null && (
                  <button
                    type="button"
                    onClick={() => void save(null)}
                    disabled={saving}
                    className="rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
                  >
                    {t("risk.useSuggested")}
                  </button>
                )}
              </div>
            )}

            {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </>
      )}
    </section>
  );
}
