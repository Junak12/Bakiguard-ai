"use client";

import { MessageCircle, MessageSquareText, PhoneCall } from "lucide-react";

import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import {
  buildReminderText,
  logReminder,
  smsUrl,
  statementUrl,
  whatsappUrl,
  type ReminderChannel,
} from "@/lib/reminders";

export interface RemindTarget {
  _id: string;
  name: string;
  phone: string;
  totalDue: number;
  nextDueAt?: string | null;
  statementToken?: string | null;
}

interface Props {
  customer: RemindTarget;
  overdueAmount?: number;
  /** Called after a reminder is opened (to update "reminded today" in the UI). */
  onReminded?: (channel: ReminderChannel) => void;
  size?: "sm" | "md";
}

/**
 * WhatsApp / SMS / Call, each a real link so the phone opens the right app
 * instantly with a ready-to-send Bangla (or English) message.
 */
export default function RemindButtons({ customer, overdueAmount = 0, onReminded, size = "md" }: Props) {
  const { t, money, date } = useI18n();
  const user = useSessionUser();

  const text = buildReminderText(t, {
    customerName: customer.name,
    shopName: user?.shopName || user?.name || "",
    amount: money(customer.totalDue),
    overdueAmount: overdueAmount > 0 ? money(overdueAmount) : null,
    dueDate: customer.nextDueAt ? date(customer.nextDueAt) : null,
    paymentInfo: user?.paymentInfo,
    statementUrl: statementUrl(customer.statementToken),
  });

  function handle(channel: ReminderChannel) {
    void logReminder(customer._id, channel);
    onReminded?.(channel);
  }

  const base =
    size === "sm"
      ? "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
      : "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition";

  return (
    <div className="flex gap-2">
      <a
        href={whatsappUrl(customer.phone, text)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handle("whatsapp")}
        className={`${base} bg-[#25D366] text-white hover:brightness-95`}
      >
        <MessageCircle className="h-4 w-4" /> {t("collections.whatsapp")}
      </a>
      <a
        href={smsUrl(customer.phone, text)}
        onClick={() => handle("sms")}
        className={`${base} bg-sky-50 text-sky-700 hover:bg-sky-100`}
      >
        <MessageSquareText className="h-4 w-4" /> {t("collections.sms")}
      </a>
      <a
        href={`tel:${customer.phone}`}
        onClick={() => handle("call")}
        className={`${base} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
      >
        <PhoneCall className="h-4 w-4" /> {t("collections.call")}
      </a>
    </div>
  );
}
