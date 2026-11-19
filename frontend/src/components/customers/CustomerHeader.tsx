"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Phone,
  Plus,
  Pencil,
} from "lucide-react";

import { Customer } from "@/types/customer";

interface Props {
  customer: Customer;
  onPayment: () => void;
}

export default function CustomerHeader({
  customer,
  onPayment,
}: Props) {
  const router = useRouter();

  function handleEdit() {
    router.push(`/customers/${customer._id}/edit`);
  }

  return (
    <>
      <Link
        href="/customers"
        className="group inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />

        Back to Customers
      </Link>

      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-6 sm:rounded-3xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-950 px-5 py-6 sm:px-7 sm:py-7 lg:px-8">

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            {/* CUSTOMER INFO */}

            <div className="flex min-w-0 items-center gap-4">

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white ring-1 ring-white/10 backdrop-blur-sm sm:h-16 sm:w-16 sm:text-2xl">
                {customer.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                    Customer Account
                  </span>

                  {customer.totalDue > 0 && (
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300">
                      Outstanding Baki
                    </span>
                  )}

                </div>

                <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {customer.name}
                </h1>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-300 sm:text-sm">
                  <Phone className="h-3.5 w-3.5" />

                  {customer.phone}
                </div>

              </div>
            </div>

            {/* ACTIONS */}

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

              {/* RECORD PAYMENT */}

              <button
                type="button"
                onClick={onPayment}
                disabled={customer.totalDue <= 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Plus className="h-4 w-4" />

                Record Payment
              </button>

              {/* EDIT CUSTOMER */}

              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
              >
                <Pencil className="h-4 w-4" />

                Edit Customer
              </button>

            </div>

          </div>
        </div>
      </section>
    </>
  );
}