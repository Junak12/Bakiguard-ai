
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  Pencil,
} from "lucide-react";

import Swal from "sweetalert2";

import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  getCustomer,
  updateCustomer,
} from "@/services/customer.service";

import { Customer } from "@/types/customer";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();

  const customerId = params.id as string;

  // =========================================================
  // STATE
  // =========================================================

  const [customer, setCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  // =========================================================
  // LOAD CUSTOMER
  // =========================================================

  useEffect(() => {
    if (!customerId) return;

    async function loadCustomer() {
      try {
        setLoading(true);
        setError("");

        const data = await getCustomer(customerId);

        setCustomer(data);

        setName(data.name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      } catch (error: any) {
        console.error(error);

        const message =
          error?.response?.data?.message ||
          "Unable to load customer.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, [customerId]);

  // =========================================================
  // HANDLE SAVE
  // =========================================================

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!customer) return;

    setFormError("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    // -------------------------------------------------------
    // NAME VALIDATION
    // -------------------------------------------------------

    if (trimmedName.length < 2) {
      setFormError(
        "Name must be at least 2 characters."
      );
      return;
    }

    if (trimmedName.length > 100) {
      setFormError(
        "Name cannot exceed 100 characters."
      );
      return;
    }

    // -------------------------------------------------------
    // PHONE VALIDATION
    // -------------------------------------------------------

    if (trimmedPhone.length < 10) {
      setFormError(
        "Phone number must be at least 10 characters."
      );
      return;
    }

    if (trimmedPhone.length > 15) {
      setFormError(
        "Phone number cannot exceed 15 characters."
      );
      return;
    }

    // -------------------------------------------------------
    // ADDRESS VALIDATION
    // -------------------------------------------------------

    if (trimmedAddress.length > 300) {
      setFormError(
        "Address cannot exceed 300 characters."
      );
      return;
    }

    // -------------------------------------------------------
    // CHECK WHETHER ANYTHING CHANGED
    // -------------------------------------------------------

    const nameChanged =
      trimmedName !== customer.name;

    const phoneChanged =
      trimmedPhone !== customer.phone;

    const addressChanged =
      trimmedAddress !== (customer.address || "");

    if (
      !nameChanged &&
      !phoneChanged &&
      !addressChanged
    ) {
      await Swal.fire({
        icon: "info",
        title: "No changes",
        text: "You haven't changed any customer information.",
        confirmButtonText: "Okay",
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    // -------------------------------------------------------
    // CONFIRM UPDATE
    // -------------------------------------------------------

    const result = await Swal.fire({
      icon: "question",
      title: "Save changes?",
      html: `
        <div style="font-size:14px;color:#64748b;">
          You're about to update the information for
          <br />
          <strong style="color:#0f172a;">
            ${trimmedName}
          </strong>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, save changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    // -------------------------------------------------------
    // UPDATE CUSTOMER
    // -------------------------------------------------------

    try {
      setSaving(true);
      setFormError("");

      Swal.fire({
        title: "Saving changes...",
        text: "Updating customer information.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      await updateCustomer(customerId, {
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress || undefined,
      });

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      await Swal.fire({
        icon: "success",
        title: "Customer updated",
        text: "Customer information has been updated successfully.",
        confirmButtonText: "View Customer",
        confirmButtonColor: "#4f46e5",
      });

      // -----------------------------------------------------
      // RETURN TO CUSTOMER DETAILS
      // -----------------------------------------------------

      router.push(`/customers/${customerId}`);
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        "Failed to update customer.";

      setFormError(message);

      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: message,
        confirmButtonText: "Close",
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading customer...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Please wait while we retrieve the customer information.
            </p>

          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !customer) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl px-4">

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

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />

            <div>
              <p className="font-semibold">
                Unable to load customer
              </p>

              <p className="mt-1 text-xs text-rose-600">
                {error || "Customer not found."}
              </p>
            </div>

          </div>
        </div>
      </DashboardLayout>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <DashboardLayout>

      <div className="relative mx-auto w-full max-w-4xl pb-10 sm:pb-12">

        {/* ================================================= */}
        {/* BACKGROUND */}
        {/* ================================================= */}

        <div className="pointer-events-none absolute -top-10 left-0 -z-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-[110px]" />

        <div className="pointer-events-none absolute right-0 top-40 -z-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-[120px]" />

        {/* ================================================= */}
        {/* BACK */}
        {/* ================================================= */}

        <Link
          href={`/customers/${customerId}`}
          className="group inline-flex items-center gap-2 rounded-lg py-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft
            size={16}
            className="transition-transform group-hover:-translate-x-1"
          />

          Back to Customer
        </Link>

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mt-5">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Pencil className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Edit Customer
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Update the customer's contact information.
              </p>
            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* FORM CARD */}
        {/* ================================================= */}

        <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">

          {/* CARD HEADER */}

          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-5 sm:px-7">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <User className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Customer Information
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Keep the customer's information accurate.
                </p>
              </div>

            </div>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-7"
          >

            {/* NAME */}

            <div>

              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Customer Name
                <span className="ml-1 text-rose-500">
                  *
                </span>
              </label>

              <div className="relative">

                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter customer name"
                  maxLength={100}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">
                {name.length}/100 characters
              </p>

            </div>

            {/* PHONE */}

            <div className="mt-5">

              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Phone Number
                <span className="ml-1 text-rose-500">
                  *
                </span>
              </label>

              <div className="relative">

                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Enter phone number"
                  maxLength={15}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              <p className="mt-1.5 text-[11px] text-slate-400">
                {phone.length}/15 characters
              </p>

            </div>

            {/* ADDRESS */}

            <div className="mt-5">

              <label
                htmlFor="address"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Address
                <span className="ml-2 text-xs font-normal text-slate-400">
                  Optional
                </span>
              </label>

              <div className="relative">

                <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />

                <textarea
                  id="address"
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  placeholder="Enter customer address"
                  maxLength={300}
                  rows={4}
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm font-medium leading-6 text-slate-900 shadow-sm outline-none transition hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              <p className="mt-1.5 text-right text-[11px] text-slate-400">
                {address.length}/300 characters
              </p>

            </div>

            {/* ERROR */}

            {formError && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">

                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />

                <p className="text-xs font-medium leading-5">
                  {formError}
                </p>

              </div>
            )}

            {/* DIVIDER */}

            <div className="my-7 border-t border-slate-100" />

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <Link
                href={`/customers/${customerId}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}

              </button>

            </div>

          </form>

        </div>

        {/* ================================================= */}
        {/* ACCOUNT INFORMATION */}
        {/* ================================================= */}

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
              <AlertCircle className="h-4 w-4 text-slate-500" />
            </div>

            <div>

              <p className="text-sm font-semibold text-slate-800">
                Account information
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Editing this customer's information will not
                affect their Baki, credit history, or payment
                history. Their transaction records remain
                unchanged.
              </p>

            </div>

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}

