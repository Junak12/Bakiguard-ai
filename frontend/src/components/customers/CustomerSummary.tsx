import {
  MapPin,
  Phone,
  Wallet,
} from "lucide-react";

import { Customer } from "@/types/customer";

interface Props {
  customer: Customer;
}

export default function CustomerSummary({
  customer,
}: Props) {
  return (
    <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

      {/* BAKI */}

      <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/40 to-orange-50/50 p-5 shadow-sm sm:rounded-3xl sm:p-6">

        <div className="flex items-start justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Baki
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600 sm:text-3xl">
              ৳{customer.totalDue.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Outstanding customer balance
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Wallet className="h-5 w-5" />
          </div>

        </div>

      </div>

      {/* PHONE */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">

        <div className="flex items-start justify-between">

          <div className="min-w-0">

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Phone Number
            </p>

            <p className="mt-2 truncate text-base font-semibold text-slate-900 sm:text-lg">
              {customer.phone}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Primary contact number
            </p>

          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Phone className="h-5 w-5" />
          </div>

        </div>

      </div>

      {/* ADDRESS */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Address
            </p>

            <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-slate-800">
              {customer.address ||
                "No address provided"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Customer location
            </p>

          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <MapPin className="h-5 w-5" />
          </div>

        </div>

      </div>

    </section>
  );
}