import type { TranslationKey } from "@/i18n/I18nProvider";

import api from "./api";

export type ReminderChannel = "whatsapp" | "sms" | "call";

export interface ReminderDetails {
  customerName: string;
  shopName: string;
  /** Already formatted (e.g. "৳১,২০০"). */
  amount: string;
  overdueAmount?: string | null;
  dueDate?: string | null;
  paymentInfo?: string | null;
  statementUrl?: string | null;
}

type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** Builds the reminder text in the app's current language. */
export function buildReminderText(tr: Translate, details: ReminderDetails) {
  const lines = [
    tr("reminders.greeting", { name: details.customerName }),
    [
      tr("reminders.balance", { shop: details.shopName, amount: details.amount }),
      details.overdueAmount
        ? tr("reminders.overdue", { amount: details.overdueAmount })
        : details.dueDate
          ? tr("reminders.dueOn", { date: details.dueDate })
          : "",
    ]
      .filter(Boolean)
      .join(" "),
    details.paymentInfo ? tr("reminders.payVia", { info: details.paymentInfo }) : "",
    details.statementUrl ? tr("reminders.statement", { link: details.statementUrl }) : "",
    tr("reminders.thanks"),
  ];

  return lines.filter(Boolean).join("\n");
}

/** 01712345678 -> 8801712345678 (WhatsApp wants the country code, no +). */
function internationalNumber(phone: string) {
  return `88${phone}`;
}

/** Opens the customer's chat in WhatsApp with the message ready to send. */
export function whatsappUrl(phone: string, text: string) {
  return `https://wa.me/${internationalNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/** Opens the phone's own SMS app with the message ready to send. */
export function smsUrl(phone: string, text: string) {
  return `sms:${phone}?body=${encodeURIComponent(text)}`;
}

export function statementUrl(token: string | null | undefined) {
  if (!token || typeof window === "undefined") return null;
  return `${window.location.origin}/s/${token}`;
}

/** Fire-and-forget: the reminder itself was sent from the owner's phone. */
export function logReminder(customerId: string, channel: ReminderChannel) {
  return api.post(`/customers/${customerId}/reminders`, { channel }).catch(() => undefined);
}

export async function rotateStatementLink(customerId: string) {
  const response = await api.post<{ data: { statementToken: string } }>(
    `/customers/${customerId}/statement-link`
  );
  return response.data.data.statementToken;
}
