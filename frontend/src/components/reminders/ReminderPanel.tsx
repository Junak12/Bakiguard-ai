"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { BellRing, Copy, ExternalLink, RefreshCw } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import { daysFromToday } from "@/i18n/format";
import { rotateStatementLink, statementUrl } from "@/lib/reminders";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Customer } from "@/types/customer";

import RemindButtons from "./RemindButtons";

interface Props {
  customer: Customer;
}

/** Remind (WhatsApp/SMS/call) and share the customer's statement link. */
export default function ReminderPanel({ customer }: Props) {
  const { t, number } = useI18n();

  const [token, setToken] = useState(customer.statementToken ?? null);
  const [lastRemindedAt, setLastRemindedAt] = useState(customer.lastRemindedAt ?? null);

  const link = statementUrl(token);

  const lastReminded = lastRemindedAt
    ? (() => {
        const days = -daysFromToday(lastRemindedAt);
        return days <= 0 ? t("reminders.today") : t("reminders.daysAgo", { days: number(days) });
      })()
    : null;

  async function copyLink() {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      toastSuccess(t("reminders.copied"));
    } catch {
      toastError(t("common.somethingWrong"));
    }
  }

  async function resetLink() {
    const result = await Swal.fire({
      icon: "warning",
      title: t("reminders.resetConfirmTitle"),
      text: t("reminders.resetConfirmText"),
      showCancelButton: true,
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      confirmButtonColor: "#059669",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setToken(await rotateStatementLink(customer._id));
      toastSuccess(t("reminders.resetDone"));
    } catch {
      toastError(t("common.somethingWrong"));
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{t("reminders.remind")}</h2>
            <p className="text-xs text-slate-500">
              {lastReminded
                ? t("reminders.lastReminded", { when: lastReminded })
                : t("reminders.neverReminded")}
            </p>
          </div>
        </div>
      </div>

      {customer.totalDue > 0 && (
        <div className="mt-4">
          <RemindButtons
            customer={{ ...customer, statementToken: token }}
            overdueAmount={customer.overdueAmount ?? 0}
            onReminded={() => setLastRemindedAt(new Date().toISOString())}
          />
        </div>
      )}

      {link && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-700">{t("reminders.share")}</p>
          <p className="mt-1 truncate rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">{link}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" /> {t("reminders.copyLink")}
            </button>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" /> {t("statement.title")}
            </a>
            <button
              type="button"
              onClick={resetLink}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className="h-4 w-4" /> {t("reminders.resetLink")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
