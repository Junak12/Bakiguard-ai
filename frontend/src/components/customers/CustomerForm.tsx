"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Crown, Loader2, MapPin, Phone, User } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import { toApiError } from "@/lib/errors";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import type { CreateCustomerData } from "@/types/customer";

interface CustomerFormProps {
  initial?: CreateCustomerData;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (data: CreateCustomerData) => Promise<void>;
}

/** Shared by "add customer" and "edit customer". Validates like the server. */
export default function CustomerForm({
  initial,
  submitLabel,
  submittingLabel,
  onSubmit,
}: CustomerFormProps) {
  const { t, number } = useI18n();

  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [planLimit, setPlanLimit] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const data: CreateCustomerData = {
      name: name.trim(),
      phone: normalizePhone(phone),
      address: address.trim() || undefined,
    };

    if (data.name.length < 2 || data.name.length > 100) {
      setError(t("customers.form.nameInvalid"));
      return;
    }

    if (!isValidPhone(data.phone)) {
      setError(t("customers.form.phoneInvalid"));
      return;
    }

    if ((data.address?.length ?? 0) > 300) {
      setError(t("customers.form.addressTooLong"));
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(data);
    } catch (err) {
      const apiError = toApiError(err);

      if (apiError.code === "PLAN_LIMIT_CUSTOMERS") {
        setPlanLimit(Number(apiError.errors?.limit ?? 50));
        setSubmitting(false);
        return;
      }

      setError(
        apiError.network
          ? t("common.networkError")
          : apiError.code === "DUPLICATE_PHONE"
            ? t("customers.form.duplicatePhone")
            : apiError.code === "VALIDATION_ERROR" && apiError.errors?.phone
              ? t("customers.form.phoneInvalid")
              : t("common.somethingWrong")
      );
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">{t("customers.form.name")}</span>
        <span className="relative mt-2 block">
          <User className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("customers.form.namePlaceholder")}
            autoComplete="off"
            autoFocus={!initial}
            disabled={submitting}
            className={inputClass}
          />
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">{t("customers.form.phone")}</span>
        <span className="relative mt-2 block">
          <Phone className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={t("customers.form.phonePlaceholder")}
            autoComplete="off"
            disabled={submitting}
            className={`${inputClass} tracking-wide`}
          />
        </span>
        <span className="mt-1.5 block text-xs text-slate-400">{t("customers.form.phoneHint")}</span>
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-sm font-semibold text-slate-700">
          {t("customers.form.address")}
          <span className="text-xs font-normal text-slate-400">{t("common.optional")}</span>
        </span>
        <span className="relative mt-2 block">
          <MapPin className="pointer-events-none absolute left-4 top-4 h-4.5 w-4.5 text-slate-400" />
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={t("customers.form.addressPlaceholder")}
            rows={2}
            maxLength={300}
            disabled={submitting}
            className={`${inputClass} resize-none`}
          />
        </span>
      </label>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {planLimit !== null && (
        <p role="alert" className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <Crown className="h-4 w-4 text-amber-500" />
          {t("billing.limitCustomers", { limit: number(planLimit) })}
          <Link href="/billing" className="font-semibold underline">
            {t("billing.upgradeCta")}
          </Link>
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
