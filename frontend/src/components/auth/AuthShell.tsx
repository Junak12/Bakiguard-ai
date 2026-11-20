"use client";

import type { ReactNode } from "react";
import { BellRing, CheckCircle2, Languages, LockKeyhole, ShieldCheck } from "lucide-react";

import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";

/** Brand panel (desktop) + form card. Shared by phone and email login. */
export default function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  const points = [
    { icon: Languages, text: t("auth.heroPoint1") },
    { icon: LockKeyhole, text: t("auth.heroPoint2") },
    { icon: BellRing, text: t("auth.heroPoint3") },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-[#07110d] lg:flex lg:w-1/2">
          <div className="absolute -left-40 -top-40 h-150 w-150 rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute -bottom-40 -right-20 h-125 w-125 rounded-full bg-teal-400/10 blur-[120px]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-white">{t("common.appName")}</p>
                <p className="text-xs text-white/40">{t("common.tagline")}</p>
              </div>
            </div>

            <div className="max-w-xl">
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
                {t("auth.heroTitle")}
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/50">
                {t("auth.heroSubtitle")}
              </p>

              <ul className="mt-10 space-y-4">
                {points.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-white/70">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <Icon className="h-4 w-4 text-emerald-400" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <p className="flex items-center gap-2 text-sm text-white/30">
              <CheckCircle2 className="h-4 w-4" /> bakiguard.app
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="flex flex-1 flex-col px-5 py-6 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:invisible">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">{t("common.appName")}</span>
            </div>
            <LanguageToggle />
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-105">{children}</div>
          </div>

          <p className="mx-auto max-w-sm text-center text-xs text-slate-400">{t("auth.terms")}</p>
        </section>
      </div>
    </main>
  );
}
