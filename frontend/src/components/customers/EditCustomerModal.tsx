"use client";

import { useEffect, useState } from "react";

import {
  X,
  User,
  Phone,
  MapPin,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";

import Swal from "sweetalert2";

import { Customer } from "@/types/customer";
import { updateCustomer } from "@/services/customer.service";

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export default function EditCustomerModal({
  customer,
  onClose,
  onSuccess,
}: EditCustomerModalProps) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [address, setAddress] = useState(
    customer.address || ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(customer.name);
    setPhone(customer.phone);
    setAddress(customer.address || "");
  }, [customer]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    // -------------------------------------------------------
    // FRONTEND VALIDATION
    // -------------------------------------------------------

    if (trimmedName.length < 2) {
      setError(
        "Name must be at least 2 characters."
      );
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "Name cannot exceed 100 characters."
      );
      return;
    }

    if (
      trimmedPhone.length < 10 ||
      trimmedPhone.length > 15
    ) {
      setError(
        "Phone number must be between 10 and 15 characters."
      );
      return;
    }

    if (trimmedAddress.length > 300) {
      setError(
        "Address cannot exceed 300 characters."
      );
      return;
    }

    // -------------------------------------------------------
    // CHECK WHETHER ANYTHING CHANGED
    // -------------------------------------------------------

    const hasChanges =
      trimmedName !== customer.name ||
      trimmedPhone !== customer.phone ||
      trimmedAddress !==
        (customer.address || "");

    if (!hasChanges) {
      await Swal.fire({
        icon: "info",
        title: "No changes",
        text: "You haven't changed any customer information.",
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    // -------------------------------------------------------
    // SAVE
    // -------------------------------------------------------

    try {
      setSaving(true);

      await updateCustomer(customer._id, {
        name: trimmedName,
        phone: trimmedPhone,
        address: trimmedAddress || undefined,
      });

      await onSuccess();

      await Swal.fire({
        icon: "success",
        title: "Customer updated",
        text: "Customer information has been updated successfully.",
        confirmButtonColor: "#4f46e5",
        timer: 2000,
        timerProgressBar: true,
      });

      onClose();
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.message ||
        "Failed to update customer.";

      setError(message);

      await Swal.fire({
        icon: "error",
        title: "Update failed",
        text: message,
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <User className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Edit Customer
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Update customer information
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

          </div>
        </div>

        {/* ================================================= */}
        {/* FORM */}
        {/* ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6"
        >

          {/* NAME */}

          <div>
            <label
              htmlFor="customer-name"
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
                id="customer-name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                maxLength={100}
                disabled={saving}
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Customer name"
              />

            </div>

            <p className="mt-1.5 text-[10px] text-slate-400">
              {name.length}/100 characters
            </p>
          </div>

          {/* PHONE */}

          <div className="mt-5">

            <label
              htmlFor="customer-phone"
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
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                maxLength={15}
                disabled={saving}
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Phone number"
              />

            </div>

            <p className="mt-1.5 text-xs text-slate-400">
              Enter 10–15 characters.
            </p>

          </div>

          {/* ADDRESS */}

          <div className="mt-5">

            <label
              htmlFor="customer-address"
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
                id="customer-address"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                maxLength={300}
                rows={3}
                disabled={saving}
                className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 pl-11 text-sm font-medium leading-6 text-slate-900 outline-none transition hover:border-slate-400 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Customer address"
              />

            </div>

            <div className="mt-1 text-right text-[10px] text-slate-400">
              {address.length}/300
            </div>

          </div>

          {/* BALANCE NOTICE */}

          <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">

            <div className="flex gap-2.5">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

              <div>

                <p className="text-xs font-semibold text-amber-800">
                  Current Baki won't be changed
                </p>

                <p className="mt-1 text-[11px] leading-5 text-amber-700">
                  Customer balance can only be changed
                  through credits and payments.
                </p>

              </div>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />

              <p className="text-xs font-medium leading-5">
                {error}
              </p>

            </div>
          )}

          {/* BUTTONS */}

          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  );
}
