"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Check, Crown, Loader2, X } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import NoPermission from "@/components/layout/NoPermission";
import { usePermissions } from "@/hooks/usePermissions";
import { useI18n } from "@/i18n/I18nProvider";
import { getBilling, submitPayment, type BillingInfo } from "@/lib/business";
import { toApiError } from "@/lib/errors";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { refreshAccessToken } from "@/lib/session";
import { toastSuccess } from "@/lib/toast";

export default function BillingPage() {
  return (
    <DashboardLayout>
      <Guarded />
    </DashboardLayout>
  );
}

function Guarded() {
  const permissions = usePermissions();
  return permissions.canManageBilling ? <Billing /> : <NoPermission />;
}

function Billing() {
  const { t, money, number, date } = useI18n();

  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [trxId, setTrxId] = useState("");
  const [sender, setSender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getBilling()
      .then((data) => active && setInfo(data))
      .catch(() => undefined);
    // Refresh the session too, so a newly approved plan shows everywhere.
    void refreshAccessToken();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleanTrx = trxId.trim().toUpperCase();

    if (!/^[A-Z0-9]{8,12}$/.test(cleanTrx)) {
      setError(t("billing.errors.trxId"));
      return;
    }

    if (!isValidPhone(sender)) {
      setError(t("billing.errors.sender"));
      return;
    }

    setSubmitting(true);

    try {
      await submitPayment(cleanTrx, normalizePhone(sender));
      toastSuccess(t("billing.submitted"));
      setTrxId("");
      setReloadKey((key) => key + 1);
    } catch (err) {
      const apiError = toApiError(err);
      setError(
        apiError.network
          ? t("common.networkError")
          : apiError.code === "TRX_ID_USED"
            ? t("billing.errors.used")
            : apiError.code === "PAYMENT_PENDING"
              ? t("billing.errors.pending")
              : t("common.somethingWrong")
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!info) {
    return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-2xl bg-white" />;
  }

  const isPro = info.plan === "pro";
  const limitText = (value: number | null) => (value === null ? t("billing.unlimited") : number(value));

  const plans = [
    { id: "free" as const, limits: info.plans.free },
    { id: "pro" as const, limits: info.plans.pro },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("billing.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("billing.subtitle")}</p>
      </div>

      {/* Current plan + usage */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs text-slate-500">{t("billing.currentPlan")}</p>
        <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
          {isPro && <Crown className="h-6 w-6 text-amber-500" />}
          {isPro ? t("billing.pro") : t("billing.free")}
        </p>
        {isPro && info.expiresAt && (
          <p className="text-sm text-slate-500">{t("billing.proUntil", { date: date(info.expiresAt) })}</p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">{t("billing.customers")}</dt>
            <dd className="font-semibold text-slate-900">
              {info.limits.maxCustomers === null
                ? t("billing.usageUnlimited", { used: number(info.usage.customers) })
                : t("billing.usage", { used: number(info.usage.customers), limit: number(info.limits.maxCustomers) })}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">{t("billing.staff")}</dt>
            <dd className="font-semibold text-slate-900">
              {t("billing.usage", { used: number(info.usage.staff), limit: number(info.limits.maxStaff) })}
            </dd>
          </div>
        </dl>
      </section>

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map(({ id, limits }) => (
          <section
            key={id}
            className={`rounded-2xl border bg-white p-5 shadow-sm ${
              id === "pro" ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
            }`}
          >
            <p className="flex items-center gap-2 text-lg font-bold text-slate-900">
              {id === "pro" && <Crown className="h-5 w-5 text-amber-500" />}
              {t(id === "pro" ? "billing.pro" : "billing.free")}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {t("billing.perMonth", { price: money(limits.priceBdt) })}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { ok: true, text: t("billing.featureCustomers", { value: limitText(limits.maxCustomers) }) },
                {
                  ok: limits.maxStaff > 0,
                  text: t("billing.featureStaff", { value: number(limits.maxStaff) }),
                },
                { ok: limits.reportExport, text: t("billing.featureExport") },
                { ok: true, text: t("billing.featureEverything") },
              ].map((feature) => (
                <li key={feature.text} className="flex items-start gap-2">
                  {feature.ok ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label={t("billing.included")} />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-label={t("billing.notIncluded")} />
                  )}
                  <span className={feature.ok ? "text-slate-700" : "text-slate-400"}>{feature.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Pay with bKash */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          {isPro ? t("billing.renewTitle") : t("billing.upgradeTitle")}
        </h2>

        {info.pendingPayment ? (
          <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            {t("billing.pending", { trxId: info.pendingPayment.trxId })}
          </p>
        ) : (
          <>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                  {number(1)}
                </span>
                {info.payTo.number
                  ? t("billing.step1", { amount: money(info.payTo.amount), number: info.payTo.number })
                  : t("billing.step1NoNumber")}
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                  {number(2)}
                </span>
                <span>
                  {t("billing.step2", { reference: "" })}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-bold">{info.payTo.reference}</code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
                  {number(3)}
                </span>
                {t("billing.step3")}
              </li>
            </ol>

            <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                {t("billing.trxId")}
                <input
                  value={trxId}
                  onChange={(event) => setTrxId(event.target.value)}
                  placeholder={t("billing.trxIdPlaceholder")}
                  autoCapitalize="characters"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-base uppercase outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                {t("billing.sender")}
                <input
                  value={sender}
                  onChange={(event) => setSender(event.target.value)}
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                />
              </label>

              {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !info.payTo.number}
                className="flex items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 text-base font-semibold text-white hover:bg-pink-700 disabled:opacity-50 sm:col-span-2"
              >
                {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                {submitting ? t("billing.submitting") : t("billing.submit")}
              </button>
            </form>
          </>
        )}
      </section>

      {info.payments.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 p-5 font-bold text-slate-900">{t("billing.history")}</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {info.payments.map((payment) => (
              <li key={payment._id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span>
                  <span className="font-mono font-semibold text-slate-900">{payment.trxId}</span>
                  <span className="block text-xs text-slate-500">
                    {date(payment.createdAt)}
                    {payment.note && <> · {payment.note}</>}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold text-slate-900">{money(payment.amount)}</span>
                  <span
                    className={`text-xs font-semibold ${
                      payment.status === "approved"
                        ? "text-emerald-700"
                        : payment.status === "rejected"
                          ? "text-rose-700"
                          : "text-amber-700"
                    }`}
                  >
                    {t(`billing.status.${payment.status}`)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
