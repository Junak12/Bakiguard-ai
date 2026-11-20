"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { daysFromToday } from "@/i18n/format";
import type { Customer } from "@/types/customer";

/** "12 days late" / "Due in 5 days" / "Settled" pill for a customer. */
export default function DueStatus({
  customer,
}: {
  customer: Pick<Customer, "totalDue" | "nextDueAt">;
}) {
  const { t, number } = useI18n();

  if (customer.totalDue <= 0) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        {t("customers.status.settled")}
      </span>
    );
  }

  if (!customer.nextDueAt) {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        {t("customers.status.owes")}
      </span>
    );
  }

  const days = daysFromToday(customer.nextDueAt);

  if (days < 0) {
    return (
      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
        {t("customers.status.overdueBy", { days: number(-days) })}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
      {days === 0
        ? t("customers.status.dueToday")
        : t("customers.status.dueIn", { days: number(days) })}
    </span>
  );
}
