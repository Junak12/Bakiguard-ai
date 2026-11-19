"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  User,
  Phone,
  MapPin,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { createCustomer } from "@/lib/customer";

export default function NewCustomerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
      });

      // Success alert
      await Swal.fire({
        icon: "success",
        title: "Customer Created!",
        text: `${name.trim()} has been added successfully.`,
        confirmButtonText: "View Customers",
        confirmButtonColor: "#4f46e5",
        background: "#ffffff",
        color: "#0f172a",
        customClass: {
          popup: "rounded-2xl",
          confirmButton: "rounded-xl px-5 py-3 font-semibold",
        },
      });

      router.push("/customers");
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        "Failed to create customer.";

      setError(message);

      // Error alert
      Swal.fire({
        icon: "error",
        title: "Unable to Create Customer",
        text: message,
        confirmButtonText: "Try Again",
        confirmButtonColor: "#4f46e5",
        background: "#ffffff",
        color: "#0f172a",
        customClass: {
          popup: "rounded-2xl",
          confirmButton: "rounded-xl px-5 py-3 font-semibold",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="relative mx-auto w-full max-w-2xl px-1 pb-10 sm:pb-12">
        {/* ========================================================= */}
        {/* AMBIENT BACKGROUND */}
        {/* ========================================================= */}

        <div className="pointer-events-none absolute -top-10 left-0 -z-10 h-56 w-56 rounded-full bg-purple-500/10 blur-[100px] sm:left-10 sm:h-72 sm:w-72 sm:bg-gradient-to-br sm:from-pink-500/15 sm:to-purple-500/15 sm:blur-[120px]" />

        <div className="pointer-events-none absolute right-0 top-40 -z-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-[110px] sm:right-10 sm:h-80 sm:w-80 sm:bg-gradient-to-br sm:from-cyan-400/15 sm:to-emerald-400/15 sm:blur-[140px]" />

        {/* ========================================================= */}
        {/* BACK LINK */}
        {/* ========================================================= */}

        <Link
          href="/customers"
          className="group inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:text-indigo-600"
        >
          <ArrowLeft
            size={16}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />

          <span>Back to Customers</span>
        </Link>

        {/* ========================================================= */}
        {/* MAIN CARD */}
        {/* ========================================================= */}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 sm:mt-6 sm:rounded-3xl">
          {/* ======================================================= */}
          {/* HEADER */}
          {/* ======================================================= */}

          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-950 px-5 py-6 text-white sm:px-8 sm:py-8">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl sm:h-64 sm:w-64" />

            <div className="pointer-events-none absolute bottom-0 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative z-10 flex items-start gap-4">
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200 ring-1 ring-white/10 backdrop-blur-sm sm:h-14 sm:w-14 sm:rounded-2xl">
                <UserPlus
                  size={21}
                  strokeWidth={1.8}
                  className="sm:h-6 sm:w-6"
                />
              </div>

              {/* Heading */}
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-indigo-200 backdrop-blur-md sm:px-3 sm:text-[10px]">
                  <Sparkles className="h-3 w-3 text-indigo-300" />

                  <span>Customer Directory</span>
                </div>

                <h1 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-3xl">
                  Add New Customer
                </h1>

                <p className="mt-1 max-w-lg text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
                  Create a customer profile to manage credit, payments,
                  balances, and transaction history.
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* FORM */}
          {/* ======================================================= */}

          <div className="p-5 sm:p-8">
            {/* Error Banner */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />

                <div>
                  <p className="font-semibold">
                    Unable to create customer
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-rose-600">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 sm:space-y-6"
            >
              {/* ===================================================== */}
              {/* CUSTOMER NAME */}
              {/* ===================================================== */}

              <div>
                <label
                  htmlFor="customer-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Customer Name{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <User
                    size={18}
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="customer-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahim Ahmed"
                    required
                    autoComplete="name"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* ===================================================== */}
              {/* PHONE */}
              {/* ===================================================== */}

              <div>
                <label
                  htmlFor="customer-phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Phone Number{" "}
                  <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="customer-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* ===================================================== */}
              {/* ADDRESS */}
              {/* ===================================================== */}

              <div>
                <label
                  htmlFor="customer-address"
                  className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700"
                >
                  <span>Address</span>

                  <span className="text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    strokeWidth={1.8}
                    className="pointer-events-none absolute left-4 top-4 z-10 text-slate-400"
                  />

                  <textarea
                    id="customer-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter area, landmark, or street address..."
                    rows={4}
                    autoComplete="street-address"
                    disabled={loading}
                    className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pl-12 pr-4 text-sm font-medium leading-6 text-slate-900 shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {/* ===================================================== */}
              {/* FORM ACTIONS */}
              {/* ===================================================== */}

              <div className="border-t border-slate-100 pt-5 sm:pt-6">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {/* Cancel */}
                  <Link
                    href="/customers"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] sm:w-auto"
                  >
                    Cancel
                  </Link>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        <span>Creating Customer...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />

                        <span>Create Customer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FOOTER NOTE */}
        {/* ========================================================= */}

        <div className="mt-4 flex items-start gap-2 px-1 text-xs leading-5 text-slate-400 sm:mt-5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

          <p>
            Fields marked with{" "}
            <span className="text-rose-500">*</span> are
            required. You can add or update customer information
            later.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}