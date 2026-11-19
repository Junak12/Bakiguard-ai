"use client";

import { WifiOff } from "lucide-react";

import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";

export default function OfflinePage() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
        <WifiOff className="h-8 w-8" />
      </div>

      <h1 className="mt-6 text-xl font-bold text-slate-900">{t("pwa.offlineTitle")}</h1>

      <p className="mt-2 max-w-sm text-sm text-slate-600">{t("pwa.offlineText")}</p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
      >
        {t("pwa.offlineRetry")}
      </button>

      <LanguageToggle className="mt-8" />
    </main>
  );
}
