"use client";

import Link from "next/link";
import {
  AlarmClock,
  Users,
  ArrowRight,
  BrainCircuit,
  Calculator,
  HandCoins,
  Languages,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";

export default function Home() {
  const { t, money, number } = useI18n();

  const features = [
    { icon: AlarmClock, title: t("landing.f1Title"), text: t("landing.f1Text") },
    { icon: Languages, title: t("landing.f2Title"), text: t("landing.f2Text") },
    { icon: Users, title: t("landing.f3Title"), text: t("landing.f3Text") },
    { icon: BrainCircuit, title: t("landing.f4Title"), text: t("landing.f4Text") },
    { icon: Calculator, title: t("landing.f5Title"), text: t("landing.f5Text") },
    { icon: LockKeyhole, title: t("landing.f6Title"), text: t("landing.f6Text") },
  ];

  const steps = [
    { title: t("landing.how1Title"), text: t("landing.how1Text") },
    { title: t("landing.how2Title"), text: t("landing.how2Text") },
    { title: t("landing.how3Title"), text: t("landing.how3Text") },
  ];

  // Illustration only: sample figures for the hero card.
  const demoCustomers = [
    { name: "রহিম স্টোর", amount: 12500, late: 34 },
    { name: "করিম মিয়া", amount: 8200, late: 12 },
    { name: "হাসান ট্রেডার্স", amount: 5800, late: 0 },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
              <ShieldCheck className="h-5 w-5 text-white" />
            </span>
            <span className="text-lg font-bold">{t("common.appName")}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle className="hidden sm:inline-flex" />
            <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              {t("landing.login")}
            </Link>
            <Link href="/register" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
              {t("landing.start")}
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> {t("landing.badge")}
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t("landing.heroTitle")}{" "}
            <span className="text-emerald-600">{t("landing.heroHighlight")}</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{t("landing.heroText")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
            >
              {t("landing.heroCta")} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-400">{t("landing.heroNote")}</p>

          <LanguageToggle className="mt-6 sm:hidden" />
        </div>

        {/* Product illustration */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-100/60 blur-2xl" aria-hidden />
          <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs text-amber-700">{t("landing.demoTotal")}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{money(26500)}</p>
              </div>
              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-xs text-rose-700">{t("landing.demoOverdue")}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{money(20700)}</p>
              </div>
            </div>

            <ul className="mt-4 divide-y divide-slate-100">
              {demoCustomers.map((customer) => (
                <li key={customer.name} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    {customer.late > 0 && (
                      <p className="text-xs font-medium text-rose-600">
                        {t("landing.demoLate", { days: number(customer.late) })}
                      </p>
                    )}
                  </div>
                  <p className="font-bold">{money(customer.amount)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-50 p-3">
              <HandCoins className="h-5 w-5 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                {t("landing.demoPaid")}: <strong>{money(2500)}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold">{t("landing.howTitle")}</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                  {number(index + 1)}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mx-auto max-w-2xl text-center text-3xl font-bold">{t("landing.featuresTitle")}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-[#07110d] px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">{t("landing.ctaTitle")}</h2>
          <p className="mt-3 text-white/60">{t("landing.ctaText")}</p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 font-semibold text-white hover:bg-emerald-400"
          >
            {t("landing.start")} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        {t("landing.footer", { year: number(new Date().getFullYear()) })}
      </footer>
    </main>
  );
}
