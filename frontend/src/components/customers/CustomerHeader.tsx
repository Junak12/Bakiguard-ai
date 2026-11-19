"use client";

import Link from "next/link";
import { ArrowLeft, HandCoins, Pencil, PhoneCall, ShoppingBag } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import type { Customer } from "@/types/customer";

import DueStatus from "./DueStatus";

interface Props {
  customer: Customer;
  onCredit: () => void;
  onPayment: () => void;
}

export default function CustomerHeader({ customer, onCredit, onPayment }: Props) {
  const { t } = useI18n();

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {t("customers.detail.back")}
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-700">
            {customer.name.trim().charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">{customer.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">{customer.phone}</span>
              <DueStatus customer={customer} />
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <a
              href={`tel:${customer.phone}`}
              aria-label={t("customers.detail.call")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
            >
              <PhoneCall className="h-4.5 w-4.5" />
            </a>
            <Link
              href={`/customers/${customer._id}/edit`}
              aria-label={t("customers.detail.edit")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              <Pencil className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>

        {/* The two actions a shopkeeper uses all day: big and thumb-reachable. */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCredit}
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.99]"
          >
            <ShoppingBag className="h-5 w-5" /> {t("customers.detail.addCredit")}
          </button>
          <button
            type="button"
            onClick={onPayment}
            disabled={customer.totalDue <= 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:bg-slate-200 disabled:text-slate-400"
          >
            <HandCoins className="h-5 w-5" /> {t("customers.detail.addPayment")}
          </button>
        </div>
      </section>
    </div>
  );
}
