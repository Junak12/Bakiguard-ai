"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Users,
  Phone,
  ArrowRight,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getCustomers } from "@/lib/customer";
import { Customer } from "@/types/customer";

export default function CustomersPage() {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getCustomers();

        setCustomers(data);
      } catch (error) {
        console.error(error);

        setError(
          "Unable to load customers."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const filteredCustomers =
    customers.filter((customer) => {
      const query =
        search.toLowerCase();

      return (
        customer.name
          .toLowerCase()
          .includes(query) ||
        customer.phone
          .toLowerCase()
          .includes(query)
      );
    });

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Customer management
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
              Customers
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage your customers and track their
              outstanding balances.
            </p>
          </div>

          <Link
            href="/customers/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            <Plus size={17} />
            Add Customer
          </Link>
        </div>

        {/* Search */}
        <div className="mt-8">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name or phone..."
              className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {loading && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />

              <p className="mt-4 text-sm text-zinc-500">
                Loading customers...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredCustomers.length === 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                  <Users
                    size={22}
                    className="text-zinc-500"
                  />
                </div>

                <h3 className="mt-4 font-semibold text-zinc-900">
                  No customers found
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Try a different search or add a
                  new customer.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filteredCustomers.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50">
                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Customer
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Phone
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Current Baki
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-100">
                      {filteredCustomers.map(
                        (customer) => (
                          <tr
                            key={customer._id}
                            className="transition hover:bg-zinc-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                                  {customer.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <p className="text-sm font-medium text-zinc-900">
                                    {customer.name}
                                  </p>

                                  {customer.email && (
                                    <p className="text-xs text-zinc-400">
                                      {customer.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2 text-sm text-zinc-600">
                                <Phone size={14} />
                                {customer.phone}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="text-sm font-semibold text-amber-600">
                                ৳
                                {(
                                  customer.currentBaki ??
                                  0
                                ).toLocaleString()}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/customers/${customer._id}`}
                                className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
                              >
                                View
                                <ArrowRight
                                  size={15}
                                />
                              </Link>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="divide-y divide-zinc-100 md:hidden">
                  {filteredCustomers.map(
                    (customer) => (
                      <Link
                        key={customer._id}
                        href={`/customers/${customer._id}`}
                        className="block p-5 transition hover:bg-zinc-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                              {customer.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-medium text-zinc-900">
                                {customer.name}
                              </p>

                              <p className="mt-1 text-xs text-zinc-500">
                                {customer.phone}
                              </p>
                            </div>
                          </div>

                          <ArrowRight
                            size={17}
                            className="text-zinc-400"
                          />
                        </div>

                        <div className="mt-4 rounded-xl bg-zinc-50 p-3">
                          <p className="text-xs text-zinc-400">
                            Current Baki
                          </p>

                          <p className="mt-1 font-semibold text-amber-600">
                            ৳
                            {(
                              customer.currentBaki ??
                              0
                            ).toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}