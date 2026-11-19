"use client";

import { useState } from "react";

import Swal from "sweetalert2";

import {
  AlertCircle,
  CreditCard,
  Loader2,
  Wallet,
  X,
} from "lucide-react";

import {
  createTransaction,
} from "@/services/customer.service";

import { Customer } from "@/types/customer";
import { TransactionType } from "@/types/transaction";

interface Props {
  customer: Customer;

  type: TransactionType;

  onClose: () => void;

  onSuccess: () => Promise<void>;
}

export default function TransactionModal({
  customer,
  type,
  onClose,
  onSuccess,
}: Props) {
  const [amount, setAmount] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const isCredit = type === "CREDIT";

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const numericAmount = Number(amount);

    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Invalid amount",
        text: "Please enter a whole amount in Taka, greater than 0.",
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    if (
      type === "PAYMENT" &&
      numericAmount > customer.totalDue
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Payment exceeds Baki",
        text: `Maximum payment is ৳${customer.totalDue.toLocaleString()}.`,
        confirmButtonColor: "#4f46e5",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "question",

      title: isCredit
        ? "Confirm credit?"
        : "Confirm payment?",

      text: isCredit
        ? `Add ৳${numericAmount.toLocaleString()} credit?`
        : `Record ৳${numericAmount.toLocaleString()} payment?`,

      showCancelButton: true,

      confirmButtonText: isCredit
        ? "Yes, add credit"
        : "Yes, record payment",

      cancelButtonText: "Cancel",

      confirmButtonColor: isCredit
        ? "#4f46e5"
        : "#059669",

      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setFormError("");

      Swal.fire({
        title: isCredit
          ? "Adding credit..."
          : "Recording payment...",

        text: "Updating customer account.",

        allowOutsideClick: false,
        allowEscapeKey: false,

        showConfirmButton: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      await createTransaction({
        customerId: customer._id,
        type,
        amount: numericAmount,
        description:
          description.trim() || undefined,
      });

      await onSuccess();

      Swal.close();

      const newBalance = isCredit
        ? customer.totalDue + numericAmount
        : customer.totalDue - numericAmount;

      await Swal.fire({
        icon: "success",

        title: isCredit
          ? "Credit added successfully"
          : "Payment recorded successfully",

        html: `
          <div style="font-size:14px;color:#64748b">
            ${
              isCredit
                ? "Credit added:"
                : "Payment received:"
            }

            <br/>

            <strong style="font-size:22px;color:${
              isCredit ? "#4f46e5" : "#059669"
            }">
              ৳${numericAmount.toLocaleString()}
            </strong>

            <br/><br/>

            New Baki:
            <strong style="color:#0f172a">
              ৳${newBalance.toLocaleString()}
            </strong>
          </div>
        `,

        confirmButtonText: "Done",

        confirmButtonColor: "#4f46e5",
      });

      onClose();
    } catch (error: any) {
      console.error(error);

      Swal.close();

      const message =
        error?.response?.data?.message ||
        "Failed to create transaction.";

      setFormError(message);

      await Swal.fire({
        icon: "error",
        title: "Transaction failed",
        text: message,
        confirmButtonColor: "#e11d48",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget &&
          !submitting
        ) {
          onClose();
        }
      }}
    >

      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">

        {/* HEADER */}

        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-5 py-5 sm:px-6">

          <div className="flex items-start justify-between">

            <div className="flex items-center gap-3">

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  isCredit
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {isCredit ? (
                  <CreditCard className="h-5 w-5" />
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  {isCredit
                    ? "Add Credit"
                    : "Add Payment"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {customer.name}
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

          </div>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6"
        >

          {/* CURRENT BAKI */}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Baki
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              ৳{customer.totalDue.toLocaleString()}
            </p>

          </div>

          {/* AMOUNT */}

          <div className="mt-5">

            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Amount{" "}
              <span className="text-rose-500">
                *
              </span>
            </label>

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                ৳
              </span>

              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="0"
                disabled={submitting}
                required
                autoFocus
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-3.5 pl-9 pr-4 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
              />

            </div>

            {!isCredit && (
              <p className="mt-1.5 text-xs text-slate-400">
                Maximum payment: ৳
                {customer.totalDue.toLocaleString()}
              </p>
            )}

          </div>

          {/* DESCRIPTION */}

          <div className="mt-5">

            <label
              htmlFor="description"
              className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700"
            >
              <span>Description</span>

              <span className="text-xs font-normal text-slate-400">
                Optional
              </span>
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder={
                isCredit
                  ? "e.g. Grocery purchase"
                  : "e.g. Cash payment"
              }
              maxLength={300}
              rows={3}
              disabled={submitting}
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />

            <div className="mt-1 text-right text-[10px] text-slate-400">
              {description.length}/300
            </div>

          </div>

          {/* ERROR */}

          {formError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">

              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />

              <p className="text-xs font-medium">
                {formError}
              </p>

            </div>
          )}

          {/* BUTTONS */}

          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white ${
                isCredit
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >

              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isCredit ? (
                <>
                  <CreditCard className="h-4 w-4" />
                  Add Credit
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Add Payment
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}