"use client";

import { type FormEvent, useState } from "react";
import { CalendarClock, CheckCircle2, Languages, Loader2, Store } from "lucide-react";

import LanguageToggle from "@/components/i18n/LanguageToggle";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import { toAsciiDigits } from "@/i18n/format";
import { updateProfile } from "@/lib/auth";
import { toApiError } from "@/lib/errors";
import { setCurrentUser, type SessionUser } from "@/lib/session";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsForm />
    </DashboardLayout>
  );
}

function SettingsForm() {
  const user = useSessionUser();

  // DashboardLayout renders children only once the session exists.
  if (!user) return null;

  return <SettingsFields key={user.id} user={user} />;
}

function SettingsFields({ user }: { user: SessionUser }) {
  const { t } = useI18n();

  // Shown once after first sign-in (?welcome=1). Read on mount: no Suspense needed.
  const [welcome] = useState(
    () => typeof window !== "undefined" && window.location.search.includes("welcome=1")
  );

  const [name, setName] = useState(user.name);
  const [shopName, setShopName] = useState(user.shopName ?? "");
  const [paymentInfo, setPaymentInfo] = useState(user.paymentInfo ?? "");
  const [creditDays, setCreditDays] = useState(String(user.defaultCreditDays));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);

    const days = Number(toAsciiDigits(creditDays));

    if (name.trim().length < 2) {
      setError(t("settings.nameInvalid"));
      return;
    }

    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setError(t("settings.creditDaysInvalid"));
      return;
    }

    setSaving(true);

    try {
      const updated = await updateProfile({
        name: name.trim(),
        defaultCreditDays: days,
        paymentInfo: paymentInfo.trim(),
        ...(shopName.trim() ? { shopName: shopName.trim() } : {}),
      });

      setCurrentUser(updated);
      setSaved(true);
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.network ? t("common.networkError") : t("common.somethingWrong"));
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50 disabled:text-slate-500";

  return (
    <div className="mx-auto max-w-2xl">
      {welcome && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-bold text-emerald-900">{t("settings.welcomeTitle")}</p>
          <p className="mt-1 text-sm text-emerald-800">{t("settings.welcomeText")}</p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900">{t("settings.title")}</h1>
      <p className="mt-1 text-sm text-slate-500">{t("settings.subtitle")}</p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Languages className="h-5 w-5 text-emerald-600" /> {t("settings.languageSection")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("settings.languageHint")}</p>
        <LanguageToggle className="mt-4" />
      </section>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Store className="h-5 w-5 text-emerald-600" /> {t("settings.profileSection")}
          </div>
          <p className="mt-1 text-sm text-slate-500">{t("settings.profileHint")}</p>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            {t("settings.nameLabel")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className={inputClass}
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            {t("settings.shopNameLabel")}
            <input
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              placeholder={t("settings.shopNamePlaceholder")}
              autoComplete="organization"
              className={inputClass}
            />
          </label>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            {t("settings.paymentInfoLabel")}
            <input
              value={paymentInfo}
              onChange={(event) => setPaymentInfo(event.target.value)}
              placeholder={t("settings.paymentInfoPlaceholder")}
              maxLength={120}
              className={inputClass}
            />
          </label>
          <p className="mt-2 text-sm text-slate-500">{t("settings.paymentInfoHint")}</p>

          {user.phone && (
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              {t("settings.phoneLabel")}
              <input value={user.phone} disabled className={inputClass} />
            </label>
          )}

          {user.email && (
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              {t("settings.emailLabel")}
              <input value={user.email} disabled className={inputClass} />
            </label>
          )}
        </div>

        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <CalendarClock className="h-5 w-5 text-emerald-600" /> {t("settings.creditSection")}
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            {t("settings.creditDaysLabel")}
            <input
              value={creditDays}
              onChange={(event) => setCreditDays(event.target.value)}
              inputMode="numeric"
              className={`${inputClass} max-w-40`}
            />
          </label>
          <p className="mt-2 text-sm text-slate-500">{t("settings.creditDaysHint")}</p>
        </div>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        {saved && (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> {t("settings.saved")}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
          {saving ? t("common.saving") : t("common.save")}
        </button>
      </form>
    </div>
  );
}
