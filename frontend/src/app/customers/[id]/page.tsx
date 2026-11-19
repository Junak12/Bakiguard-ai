"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import {
  AlertCircle,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";

import CustomerHeader from "@/components/customers/CustomerHeader";
import CustomerSummary from "@/components/customers/CustomerSummary";
import CustomerTransactions from "@/components/customers/CustomerTransactions";
import TransactionModal from "@/components/customers/TransactionModal";
import CustomerDetailsSkeleton from "@/components/customers/CustomerDetailsSkeleton";

import { TransactionType } from "@/types/transaction";

import { useCustomerDetails } from "@/hooks/customers/useCustomerDetails";
import PaymentBehavior from "@/components/customers/PaymentBehavior";

export default function CustomerDetailsPage() {
  const params = useParams();

  const customerId = params.id as string;

  const {
    customer,
    transactions,
    loading,
    error,
    reload,
  } = useCustomerDetails(customerId);

  const [
    transactionType,
    setTransactionType,
  ] = useState<TransactionType | null>(null);

  function openTransactionModal(
    type: TransactionType
  ) {
    setTransactionType(type);
  }

  function closeTransactionModal() {
    setTransactionType(null);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <CustomerDetailsSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !customer) {
    return (
      <DashboardLayout>

        <div className="mx-auto max-w-2xl">

          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />

            <div>

              <p className="font-semibold">
                Unable to load customer
              </p>

              <p className="mt-1 text-xs text-rose-600">
                {error ||
                  "Customer not found."}
              </p>

            </div>

          </div>

        </div>

      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <div className="relative mx-auto w-full max-w-7xl pb-10 sm:pb-12">

        {/* Background */}

        <div className="pointer-events-none absolute -top-10 left-0 -z-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-[110px]" />

        <div className="pointer-events-none absolute right-0 top-40 -z-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-[120px]" />

        {/* Header */}

        <CustomerHeader
          customer={customer}
          onPayment={() =>
            openTransactionModal("PAYMENT")
          }
        />

        {/* Summary */}

        <CustomerSummary
          customer={customer}
        />

        <PaymentBehavior  transactions={transactions}/>
        

        {/* Transactions */}

        <CustomerTransactions
          customer={customer}
          transactions={transactions}
          onAddCredit={() =>
            openTransactionModal("CREDIT")
          }
          onAddPayment={() =>
            openTransactionModal("PAYMENT")
          }
        />

      </div>

      {/* Transaction Modal */}

      {transactionType && (
        <TransactionModal
          customer={customer}
          type={transactionType}
          onClose={closeTransactionModal}
          onSuccess={reload}
        />
      )}

    </DashboardLayout>
  );
}