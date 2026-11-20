"use client";

import { Lock } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";

export default function NoPermission() {
  const { t } = useI18n();

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <Lock className="mx-auto h-8 w-8 text-slate-400" />
      <p className="mt-3 text-sm text-slate-600">{t("common.noPermission")}</p>
    </div>
  );
}
