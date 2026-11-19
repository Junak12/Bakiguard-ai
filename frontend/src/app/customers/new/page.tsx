"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import CustomerForm from "@/components/customers/CustomerForm";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { createCustomer } from "@/lib/customer";
import { notifyDashboardUpdated } from "@/lib/dashboard-events";
import { toastSuccess } from "@/lib/toast";

export default function NewCustomerPage() {
  return (
    <DashboardLayout>
      <NewCustomer />
    </DashboardLayout>
  );
}

function NewCustomer() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/customers"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {t("customers.detail.back")}
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h1 className="text-2xl font-bold text-slate-900">{t("customers.form.newTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("customers.form.newSubtitle")}</p>

        <div className="mt-6">
          <CustomerForm
            submitLabel={t("customers.form.create")}
            submittingLabel={t("customers.form.creating")}
            onSubmit={async (data) => {
              const customer = await createCustomer(data);
              notifyDashboardUpdated();
              toastSuccess(t("customers.form.created", { name: customer.name }));
              // Straight to their page: the next step is usually giving Baki.
              router.replace(`/customers/${customer._id}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
