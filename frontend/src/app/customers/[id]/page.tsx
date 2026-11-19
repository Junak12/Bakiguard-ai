"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import CustomerDetailsSkeleton from "@/components/customers/CustomerDetailsSkeleton";
import CustomerHeader from "@/components/customers/CustomerHeader";
import CustomerSummary from "@/components/customers/CustomerSummary";
import CustomerTransactions from "@/components/customers/CustomerTransactions";
import PaymentBehavior from "@/components/customers/PaymentBehavior";
import ReminderPanel from "@/components/reminders/ReminderPanel";
import TransactionModal from "@/components/customers/TransactionModal";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCustomerDetails } from "@/hooks/customers/useCustomerDetails";
import { useI18n } from "@/i18n/I18nProvider";
import type { TransactionType } from "@/types/transaction";

export default function CustomerDetailsPage() {
  return (
    <DashboardLayout>
      <CustomerDetails />
    </DashboardLayout>
  );
}

function CustomerDetails() {
  const { t } = useI18n();
  const customerId = useParams<{ id: string }>().id;

  const { customer, transactions, summary, loading, error, reload, hasMore, loadingMore, loadMore } =
    useCustomerDetails(customerId);

  const [entryType, setEntryType] = useState<TransactionType | null>(null);

  if (loading) return <CustomerDetailsSkeleton />;

  if (error || !customer) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              {error === "not_found" ? t("customers.detail.notFound") : t("customers.detail.loadError")}
            </p>
            <div className="mt-3 flex gap-4 text-sm font-semibold">
              {error === "failed" && (
                <button type="button" onClick={() => void reload()} className="underline">
                  {t("common.retry")}
                </button>
              )}
              <Link href="/customers" className="underline">
                {t("customers.detail.back")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <CustomerHeader
        customer={customer}
        onCredit={() => setEntryType("CREDIT")}
        onPayment={() => setEntryType("PAYMENT")}
      />

      <CustomerSummary customer={customer} />

      {/* Re-mount after changes so "last reminded" and the link stay current. */}
      <ReminderPanel key={`${customer._id}-${customer.totalDue}`} customer={customer} />

      <CustomerTransactions
        transactions={transactions}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => void loadMore()}
      />

      <PaymentBehavior summary={summary} />

      {entryType && (
        <TransactionModal
          customer={customer}
          type={entryType}
          onClose={() => setEntryType(null)}
          onSuccess={reload}
        />
      )}
    </div>
  );
}
