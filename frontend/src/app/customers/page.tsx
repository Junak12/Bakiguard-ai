"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Plus,
  Search,
  Users,
  Phone,
  ArrowRight,
  Sparkles,
  AlertCircle,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";

import Swal from "sweetalert2";

import DashboardLayout from "@/components/layout/DashboardLayout";

import { Customer } from "@/types/customer";

import {
  getCustomers,
  deleteCustomer,
} from "@/services/customer.service";

// =========================================================
// VIVID PALETTES
// =========================================================

const VIVID_PALETTES = [
  {
    avatar: "from-pink-500 via-rose-500 to-amber-400",
    glow: "shadow-rose-500/35",
  },
  {
    avatar: "from-cyan-400 via-blue-500 to-indigo-600",
    glow: "shadow-blue-500/35",
  },
  {
    avatar: "from-emerald-400 via-teal-500 to-cyan-500",
    glow: "shadow-teal-500/35",
  },
  {
    avatar: "from-amber-400 via-orange-500 to-rose-500",
    glow: "shadow-orange-500/35",
  },
  {
    avatar: "from-fuchsia-500 via-purple-600 to-pink-500",
    glow: "shadow-purple-500/35",
  },
  {
    avatar: "from-violet-500 via-indigo-600 to-cyan-400",
    glow: "shadow-indigo-500/35",
  },
];

// =========================================================
// GET AVATAR PALETTE
// =========================================================

function getVividPalette(name: string) {
  let charSum = 0;

  for (let i = 0; i < name.length; i++) {
    charSum += name.charCodeAt(i);
  }

  return VIVID_PALETTES[
    charSum % VIVID_PALETTES.length
  ];
}

// =========================================================
// PAGE
// =========================================================

export default function CustomersPage() {
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // =======================================================
  // LOAD CUSTOMERS
  // =======================================================

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers();

      setCustomers(data);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load customer directory."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  // =======================================================
  // SEARCH
  // =======================================================

  const filteredCustomers = customers.filter(
    (customer) => {
      const query = search
        .toLowerCase()
        .trim();

      return (
        customer.name
          .toLowerCase()
          .includes(query) ||
        customer.phone
          .toLowerCase()
          .includes(query)
      );
    }
  );

  // =======================================================
  // DELETE CUSTOMER
  // =======================================================

  async function handleDeleteCustomer(
    customer: Customer
  ) {
    const dueAmount = Number(
      customer.totalDue ?? 0
    );

    // -----------------------------------------------------
    // SAFETY CHECK
    // -----------------------------------------------------

    if (dueAmount > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Customer cannot be deleted",
        text:
          "This customer still has an outstanding Baki. Please collect the full payment first.",
        confirmButtonText: "Understood",
        confirmButtonColor: "#7c3aed",
      });

      return;
    }

    // -----------------------------------------------------
    // CONFIRMATION
    // -----------------------------------------------------

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete customer?",
      html: `
        <div style="font-size: 15px; color: #64748b;">
          You are about to permanently delete
          <strong style="color: #0f172a;">
            ${customer.name}
          </strong>.
          <br />
          <br />
          This action cannot be undone.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, delete customer",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    // -----------------------------------------------------
    // DELETE
    // -----------------------------------------------------

    try {
      setDeletingId(customer._id);
      setError("");

      Swal.fire({
        title: "Deleting customer...",
        text:
          "Please wait while we remove the customer.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await deleteCustomer(customer._id);

      // Remove from frontend immediately
      setCustomers((currentCustomers) =>
        currentCustomers.filter(
          (item) =>
            item._id !== customer._id
        )
      );

      // Success
      await Swal.fire({
        icon: "success",
        title: "Customer deleted",
        text: `${customer.name} has been removed successfully.`,
        confirmButtonText: "Done",
        confirmButtonColor: "#7c3aed",
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        "Failed to delete customer.";

      setError(message);

      await Swal.fire({
        icon: "error",
        title: "Deletion failed",
        text: message,
        confirmButtonText: "Close",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setDeletingId(null);
    }
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <DashboardLayout>
      <div className="relative space-y-8 pb-12">

        {/* ================================================= */}
        {/* BACKGROUND */}
        {/* ================================================= */}

        <div className="pointer-events-none absolute -top-10 left-10 -z-10 h-80 w-80 rounded-full bg-gradient-to-br from-pink-500/30 to-purple-500/30 blur-[120px]" />

        <div className="pointer-events-none absolute top-40 right-10 -z-10 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/30 to-emerald-400/30 blur-[140px]" />

        <div className="pointer-events-none absolute bottom-10 left-1/3 -z-10 h-80 w-80 rounded-full bg-gradient-to-br from-amber-400/25 to-rose-500/25 blur-[130px]" />

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 p-6 text-white shadow-2xl shadow-indigo-950/20 sm:p-8">

          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-gradient-to-br from-pink-500/40 via-purple-500/30 to-transparent blur-3xl" />

          <div className="absolute bottom-0 right-1/3 h-48 w-48 rounded-full bg-gradient-to-tr from-cyan-400/30 to-emerald-400/20 blur-2xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">

            <div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-pink-200 shadow-lg backdrop-blur-md">

                <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />

                VIBRANT CRM • DIRECTORY

              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">

                Customer{" "}

                <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 bg-clip-text text-transparent">
                  Hub
                </span>

              </h1>

              <p className="mt-2 max-w-xl text-sm font-light text-slate-200/90 sm:text-base">
                Manage accounts, review active credit
                streams, and track balances with
                real-time analytics.
              </p>

            </div>

            <Link
              href="/customers/new"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-rose-500/30 transition duration-300 hover:scale-105 hover:shadow-rose-500/50 active:scale-95"
            >
              <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />

              Add New Customer
            </Link>

          </div>
        </div>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative max-w-md flex-1">

            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-purple-600"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name or phone..."
              className="w-full rounded-2xl border-2 border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm font-extrabold text-slate-900 caret-purple-600 shadow-md outline-none transition duration-200 placeholder:text-slate-400 focus:border-purple-600 focus:ring-4 focus:ring-purple-500/20"
            />

          </div>

          <div className="flex items-center gap-3">

            <div className="inline-flex items-center gap-2 rounded-2xl border border-purple-200/60 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 text-xs font-extrabold text-purple-900 shadow-sm">

              <Users className="h-4 w-4 text-pink-600" />

              Total Customers:

              <span className="rounded-md bg-purple-600 px-2 py-0.5 text-white">
                {filteredCustomers.length}
              </span>

            </div>

          </div>
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-300 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">

            <div className="flex items-center gap-3">

              <AlertCircle className="h-5 w-5 text-rose-500" />

              {error}

            </div>

            <button
              onClick={() => setError("")}
              className="rounded-lg px-2 py-1 hover:bg-rose-100"
            >
              ×
            </button>

          </div>
        )}

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loading && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white/80 p-12 text-center shadow-xl">

            <div className="relative flex items-center justify-center">

              <div className="h-16 w-16 animate-spin rounded-full border-4 border-pink-200 border-t-purple-600" />

              <Sparkles className="absolute h-6 w-6 animate-pulse text-amber-400" />

            </div>

            <p className="mt-5 text-base font-bold text-slate-700">
              Synthesizing customer records...
            </p>

          </div>
        )}

        {/* ================================================= */}
        {/* EMPTY */}
        {/* ================================================= */}

        {!loading &&
          !error &&
          filteredCustomers.length === 0 && (

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-12 text-center shadow-lg">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white shadow-lg">

                <UserPlus size={28} />

              </div>

              <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                No matching accounts found
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-slate-500">

                {search
                  ? `No customer matched your search query "${search}".`
                  : "You don't have any customers yet."}

              </p>

              <Link
                href="/customers/new"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:scale-105"
              >
                <Plus size={16} />

                Add Customer Now
              </Link>

            </div>
          )}

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        {!loading &&
          !error &&
          filteredCustomers.length > 0 && (

            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-xl backdrop-blur-md">

              {/* ================================================= */}
              {/* DESKTOP */}
              {/* ================================================= */}

              <div className="hidden overflow-x-auto md:block">

                <table className="w-full border-collapse text-left">

                  <thead>

                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-purple-50/50 to-pink-50/50 text-xs font-black uppercase tracking-wider text-slate-500">

                      <th className="px-6 py-4">
                        Customer Details
                      </th>

                      <th className="px-6 py-4">
                        Contact Number
                      </th>

                      <th className="px-6 py-4">
                        Current Baki
                      </th>

                      <th className="px-6 py-4 text-right">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredCustomers.map(
                      (customer) => {

                        const palette =
                          getVividPalette(
                            customer.name
                          );

                        const dueAmount =
                          Number(
                            customer.totalDue ?? 0
                          );

                        // IMPORTANT:
                        // A customer with 0 baki can
                        // still be opened and receive
                        // new credit.
                        const canDelete =
                          dueAmount === 0;

                        const isDeleting =
                          deletingId ===
                          customer._id;

                        return (

                          <tr
                            key={customer._id}
                            className="group transition duration-200 hover:bg-gradient-to-r hover:from-purple-50/40 hover:via-pink-50/30 hover:to-amber-50/20"
                          >

                            {/* CUSTOMER */}
                            <td className="px-6 py-4">

                              <div className="flex items-center gap-4">

                                <div
                                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr ${palette.avatar} text-base font-black text-white shadow-md ${palette.glow} transition-transform duration-300 group-hover:scale-110`}
                                >
                                  {customer.name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>

                                  <p className="font-extrabold text-slate-900">
                                    {customer.name}
                                  </p>

                                </div>

                              </div>

                            </td>

                            {/* PHONE */}
                            <td className="px-6 py-4">

                              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-100/90 px-3 py-1.5 text-xs font-bold text-slate-700">

                                <Phone
                                  size={13}
                                  className="text-purple-500"
                                />

                                {customer.phone}

                              </div>

                            </td>

                            {/* BAKI */}
                            <td className="px-6 py-4">

                              {dueAmount > 0 ? (

                                <span className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 px-3.5 py-1.5 text-xs font-black text-rose-700">

                                  <span className="h-2 w-2 animate-ping rounded-full bg-rose-500" />

                                  ৳{" "}
                                  {dueAmount.toLocaleString()}

                                </span>

                              ) : (

                                <span className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 px-3.5 py-1.5 text-xs font-black text-emerald-700">

                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                  ৳ 0 (Paid)

                                </span>

                              )}

                            </td>

                            {/* ================================================= */}
                            {/* ACTION */}
                            {/* ================================================= */}

                            <td className="px-6 py-4">

                              <div className="flex items-center justify-end gap-2">

                                {/* VIEW PROFILE
                                    ALWAYS AVAILABLE */}

                                <Link
                                  href={`/customers/${customer._id}`}
                                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 px-4 py-2 text-xs font-extrabold text-white shadow-md transition hover:from-purple-600 hover:to-pink-600 hover:shadow-lg"
                                >

                                  View Profile

                                  <ArrowRight
                                    size={14}
                                  />

                                </Link>

                                {/* DELETE
                                    ONLY WHEN BAKI = 0 */}

                                {canDelete && (

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteCustomer(
                                        customer
                                      )
                                    }
                                    disabled={
                                      isDeleting
                                    }
                                    title="Delete customer"

                                    className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 p-2.5 text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                                  >

                                    {isDeleting ? (

                                      <Loader2
                                        size={16}
                                        className="animate-spin"
                                      />

                                    ) : (

                                      <Trash2
                                        size={16}
                                      />

                                    )}

                                  </button>

                                )}

                              </div>

                            </td>

                          </tr>

                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* ================================================= */}
              {/* MOBILE */}
              {/* ================================================= */}

              <div className="divide-y divide-slate-100 md:hidden">

                {filteredCustomers.map(
                  (customer) => {

                    const palette =
                      getVividPalette(
                        customer.name
                      );

                    const dueAmount =
                      Number(
                        customer.totalDue ?? 0
                      );

                    const canDelete =
                      dueAmount === 0;

                    const isDeleting =
                      deletingId ===
                      customer._id;

                    return (

                      <div
                        key={customer._id}
                        className="p-5"
                      >

                        {/* TOP */}

                        <div className="flex items-start justify-between">

                          <Link
                            href={`/customers/${customer._id}`}
                            className="flex items-center gap-3.5"
                          >

                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${palette.avatar} text-lg font-black text-white shadow-md ${palette.glow}`}
                            >
                              {customer.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <p className="text-base font-extrabold text-slate-900">
                                {customer.name}
                              </p>

                              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-slate-500">

                                <Phone
                                  size={12}
                                  className="text-purple-500"
                                />

                                {customer.phone}

                              </p>

                            </div>

                          </Link>

                        </div>

                        {/* BAKI + ACTIONS */}

                        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">

                          <div className="flex items-center justify-between">

                            <div>

                              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Current Baki
                              </p>

                              <p
                                className={`mt-1 font-black text-base ${
                                  dueAmount > 0
                                    ? "text-rose-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                ৳{" "}
                                {dueAmount.toLocaleString()}
                              </p>

                            </div>

                            <div className="flex items-center gap-2">

                              {/* VIEW PROFILE ALWAYS */}

                              <Link
                                href={`/customers/${customer._id}`}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 px-3 py-2 text-xs font-bold text-white shadow-sm"
                              >
                                View

                                <ArrowRight
                                  size={13}
                                />
                              </Link>

                              {/* DELETE ONLY WHEN ZERO */}

                              {canDelete && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteCustomer(
                                      customer
                                    )
                                  }
                                  disabled={
                                    isDeleting
                                  }
                                  title="Delete customer"
                                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                                >

                                  {isDeleting ? (

                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />

                                  ) : (

                                    <Trash2
                                      size={15}
                                    />

                                  )}

                                </button>

                              )}

                            </div>

                          </div>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            </div>
          )}

      </div>
    </DashboardLayout>
  );
}