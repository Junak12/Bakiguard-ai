"use client";

import { AlarmClock, CalendarClock, HandCoins, MapPin, Wallet } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import { daysFromToday } from "@/i18n/format";
import type { Customer } from "@/types/customer";

export default function CustomerSummary({ customer }: { customer: Customer }) {
  const { t, money, number, date } = useI18n();

  const overdue = customer.overdueAmount ?? 0;
  const lastPaymentDays = customer.lastPaymentAt ? -daysFromToday(customer.lastPaymentAt) : null;

  const tiles = [
    {
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600",
      label: t("customers.detail.currentBaki"),
      value: money(customer.totalDue),
      hint: null as string | null,
    },
    {
      icon: AlarmClock,
      tone: overdue > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500",
      label: t("customers.detail.overdue"),
      value: overdue > 0 ? money(overdue) : t("customers.detail.overdueNone"),
      hint: null,
    },
    {
      icon: CalendarClock,
      tone: "bg-sky-50 text-sky-600",
      label: t("customers.detail.nextDue"),
      value: customer.nextDueAt ? date(customer.nextDueAt) : "—",
      hint: customer.nextDueAt ? null : t("customers.detail.nextDueNone"),
    },
    {
      icon: HandCoins,
      tone: "bg-emerald-50 text-emerald-600",
      label: t("customers.detail.lastPayment"),
      value: customer.lastPaymentAt ? date(customer.lastPaymentAt) : "—",
      hint:
        lastPaymentDays === null
          ? t("customers.detail.lastPaymentNone")
          : lastPaymentDays === 0
            ? t("customers.detail.today")
            : t("customers.detail.daysAgo", { days: number(lastPaymentDays) }),
    },
  ];

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, tone, label, value, hint }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p className="mt-3 text-xs text-slate-500">{label}</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
          </div>
        ))}
      </div>

      {customer.address && (
        <p className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <span>
            <span className="sr-only">{t("customers.detail.address")}: </span>
            {customer.address}
          </span>
        </p>
      )}
    </section>
  );
}
