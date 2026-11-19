"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Loader2, PhoneCall, Plus, Search, UserPlus, X } from "lucide-react";

import DueStatus from "@/components/customers/DueStatus";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { getCustomers, type CustomerListParams } from "@/lib/customer";
import type { Customer } from "@/types/customer";

type Status = NonNullable<CustomerListParams["status"]>;

const STATUSES: Status[] = ["all", "due", "overdue"];

export default function CustomersPage() {
  return (
    <DashboardLayout>
      {/* useSearchParams needs a Suspense boundary for static rendering. */}
      <Suspense fallback={null}>
        <CustomerList />
      </Suspense>
    </DashboardLayout>
  );
}

function CustomerList() {
  const { t, money, number } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status");
  const status: Status = STATUSES.includes(statusParam as Status) ? (statusParam as Status) : "all";

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Server-side filtering/search, debounced while typing.
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        setLoading(true);

        try {
          const data = await getCustomers({ status, search: search.trim() || undefined });
          if (!cancelled) {
            setCustomers(data);
            setError(false);
          }
        } catch {
          if (!cancelled) setError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      search ? 250 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, search, reloadKey]);

  function selectStatus(next: Status) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("status");
    else params.set("status", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const query = search.trim();

  function emptyMessage() {
    if (query) return { title: t("customers.list.noMatchTitle"), text: t("customers.list.noMatchText", { query }) };
    if (status === "due") return { title: t("customers.list.noMatchTitle"), text: t("customers.list.noDueText") };
    if (status === "overdue") return { title: t("customers.list.noMatchTitle"), text: t("customers.list.noOverdueText") };
    return { title: t("customers.list.emptyTitle"), text: t("customers.list.emptyText") };
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("customers.list.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("customers.list.subtitle")}</p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> {t("customers.list.add")}
        </Link>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("customers.list.searchPlaceholder")}
            aria-label={t("customers.list.searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={t("common.close")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div role="tablist" className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={status === option}
                onClick={() => selectStatus(option)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  status === option
                    ? option === "overdue"
                      ? "bg-white text-rose-700 shadow-sm"
                      : "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t(`customers.list.tabs.${option}`)}
              </button>
            ))}
          </div>

          <span className="flex items-center gap-2 text-sm text-slate-500">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {customers && t("customers.list.count", { count: number(customers.length) })}
          </span>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {t("customers.list.loadError")}
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="font-semibold underline">
            {t("common.retry")}
          </button>
        </div>
      ) : !customers ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((key) => (
            <div key={key} className="h-18 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <UserPlus className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">{emptyMessage().title}</h2>
          <p className="mt-1 text-sm text-slate-500">{emptyMessage().text}</p>
          {status === "all" && !query && (
            <Link
              href="/customers/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> {t("customers.list.add")}
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {customers.map((customer) => (
            <li key={customer._id} className="flex items-center gap-2 pr-3 sm:pr-5">
              <Link
                href={`/customers/${customer._id}`}
                className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-3 transition hover:bg-slate-50 sm:pl-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-base font-bold text-emerald-700">
                  {customer.name.trim().charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{customer.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-xs text-slate-500">{customer.phone}</span>
                    <DueStatus customer={customer} />
                  </div>
                </div>

                <p
                  className={`shrink-0 text-right font-bold ${
                    customer.totalDue > 0 ? "text-slate-900" : "text-slate-300"
                  }`}
                >
                  {money(customer.totalDue)}
                </p>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>

              <a
                href={`tel:${customer.phone}`}
                aria-label={t("customers.list.call", { name: customer.name })}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
              >
                <PhoneCall className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
