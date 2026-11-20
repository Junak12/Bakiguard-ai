"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, HandCoins, Loader2, ShoppingBag, X } from "lucide-react";

import { useRiskText } from "@/components/risk/useRiskText";

import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import { toAsciiDigits } from "@/i18n/format";
import { notifyDashboardUpdated } from "@/lib/dashboard-events";
import { toApiError } from "@/lib/errors";
import type { CustomerRiskResult } from "@/lib/risk";
import { toastSuccess } from "@/lib/toast";
import { createTransaction } from "@/services/customer.service";
import type { Customer } from "@/types/customer";
import type { TransactionType } from "@/types/transaction";

interface Props {
  customer: Customer;
  type: TransactionType;
  /** Risk + limit, for a warning before giving more Baki. */
  risk?: CustomerRiskResult | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

/** YYYY-MM-DD for today + n days, in the user's local calendar. */
function isoDateIn(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export default function TransactionModal({ customer, type, risk, onClose, onSuccess }: Props) {
  const { t, money, number } = useI18n();
  const { reasonText } = useRiskText();
  const user = useSessionUser();

  const isCredit = type === "CREDIT";

  const presets = useMemo(() => {
    const options = new Set([7, 15, 30, user?.defaultCreditDays ?? 30]);
    return [...options].sort((a, b) => a - b);
  }, [user?.defaultCreditDays]);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDays, setDueDays] = useState<number | "custom">(user?.defaultCreditDays ?? 30);
  const [customDate, setCustomDate] = useState(isoDateIn(user?.defaultCreditDays ?? 30));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Esc closes (unless saving).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  /** Warn (never block) when this credit looks risky. */
  function creditWarning(): string | null {
    if (!isCredit || !risk?.risk) return null;

    const typed = Number(toAsciiDigits(amount).replace(/[,\s]/g, ""));
    const value = Number.isInteger(typed) && typed > 0 ? typed : 0;
    const band = risk.risk.band;

    if (band === "high" && risk.creditLimit === null && risk.risk.suggestedLimit === 0) {
      return t("risk.warnStop", { name: customer.name });
    }

    if (risk.effectiveLimit !== null && value > 0 && customer.totalDue + value > risk.effectiveLimit) {
      return t("risk.warnOverLimit", {
        name: customer.name,
        balance: money(customer.totalDue + value),
        limit: money(risk.effectiveLimit),
      });
    }

    if (band === "high") {
      const reason = risk.risk.reasons.filter((r) => r.impact < 0).map(reasonText).find(Boolean);
      return t("risk.warnHigh", { name: customer.name, reason: reason ?? t("risk.bands.high") });
    }

    return null;
  }

  const warning = creditWarning();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const value = Number(toAsciiDigits(amount).replace(/[,\s]/g, ""));

    if (!Number.isInteger(value) || value <= 0) {
      setError(t("customers.entry.amountInvalid"));
      return;
    }

    if (!isCredit && value > customer.totalDue) {
      setError(t("customers.entry.paymentTooBig", { amount: money(customer.totalDue) }));
      return;
    }

    const dueDate = !isCredit ? undefined : dueDays === "custom" ? customDate : isoDateIn(dueDays);

    if (dueDate && dueDate < isoDateIn(0)) {
      setError(t("customers.entry.duePast"));
      return;
    }

    setSubmitting(true);

    try {
      await createTransaction({
        customerId: customer._id,
        type,
        amount: value,
        description: description.trim() || undefined,
        dueDate,
      });

      const balance = isCredit ? customer.totalDue + value : customer.totalDue - value;

      toastSuccess(
        t(isCredit ? "customers.entry.savedCredit" : "customers.entry.savedPayment", {
          amount: money(value),
          balance: money(balance),
        })
      );

      notifyDashboardUpdated();
      await onSuccess();
      onClose();
    } catch (err) {
      const apiError = toApiError(err);

      setError(
        apiError.network
          ? t("common.networkError")
          : apiError.code === "PAYMENT_EXCEEDS_DUE"
            ? t("customers.entry.paymentTooBig", { amount: money(customer.totalDue) })
            : t("common.somethingWrong")
      );
      setSubmitting(false);
    }
  }

  const accent = isCredit
    ? { icon: "bg-amber-50 text-amber-600", button: "bg-amber-500 hover:bg-amber-600", ring: "focus:border-amber-500 focus:ring-amber-500/15" }
    : { icon: "bg-emerald-50 text-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700", ring: "focus:border-emerald-500 focus:ring-emerald-500/15" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-title"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.icon}`}>
              {isCredit ? <ShoppingBag className="h-5 w-5" /> : <HandCoins className="h-5 w-5" />}
            </div>
            <div>
              <h2 id="transaction-title" className="font-bold text-slate-900">
                {t(isCredit ? "customers.entry.creditTitle" : "customers.entry.paymentTitle", {
                  name: customer.name,
                })}
              </h2>
              <p className="text-sm text-slate-500">
                {t("customers.entry.currentBaki", { amount: money(customer.totalDue) })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={t("common.close")}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-700">{t("customers.entry.amount")}</span>
          <span className="relative mt-2 block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
              ৳
            </span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="numeric"
              autoFocus
              placeholder={t("customers.entry.amountPlaceholder")}
              disabled={submitting}
              className={`w-full rounded-2xl border border-slate-300 py-4 pl-11 pr-4 text-3xl font-bold text-slate-900 outline-none transition placeholder:text-slate-300 focus:ring-4 ${accent.ring}`}
            />
          </span>
        </label>

        {!isCredit && customer.totalDue > 0 && (
          <button
            type="button"
            onClick={() => setAmount(String(customer.totalDue))}
            className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            {t("customers.entry.payAll")}: {money(customer.totalDue)}
          </button>
        )}

        {isCredit && (
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-slate-700">{t("customers.entry.dueLabel")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {presets.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDueDays(days)}
                  aria-pressed={dueDays === days}
                  className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                    dueDays === days
                      ? "border-amber-500 bg-amber-50 text-amber-800"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {t("customers.entry.dueIn", { days: number(days) })}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDueDays("custom")}
                aria-pressed={dueDays === "custom"}
                className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                  dueDays === "custom"
                    ? "border-amber-500 bg-amber-50 text-amber-800"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {t("customers.entry.customDate")}
              </button>
            </div>

            {dueDays === "custom" && (
              <input
                type="date"
                value={customDate}
                min={isoDateIn(0)}
                max={isoDateIn(365)}
                onChange={(event) => setCustomDate(event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15"
              />
            )}
          </fieldset>
        )}

        <label className="mt-5 block">
          <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
            {t("customers.entry.note")}
            <span className="text-xs font-normal text-slate-400">{t("common.optional")}</span>
          </span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={300}
            placeholder={t(
              isCredit ? "customers.entry.notePlaceholderCredit" : "customers.entry.notePlaceholderPayment"
            )}
            disabled={submitting}
            className={`mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${accent.ring}`}
          />
        </label>

        {warning && (
          <div role="status" className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">{warning}</p>
              <p className="mt-0.5 text-xs text-amber-800/80">{t("risk.warnProceed")}</p>
            </div>
          </div>
        )}

        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white shadow-sm transition disabled:opacity-60 ${accent.button}`}
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {submitting
            ? t("customers.entry.saving")
            : t(isCredit ? "customers.entry.saveCredit" : "customers.entry.savePayment")}
        </button>
      </form>
    </div>
  );
}
