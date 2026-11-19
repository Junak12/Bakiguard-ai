"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowLeft, Trash2 } from "lucide-react";

import CustomerForm from "@/components/customers/CustomerForm";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useI18n } from "@/i18n/I18nProvider";
import { deleteCustomer, getCustomerById, updateCustomer } from "@/lib/customer";
import { notifyDashboardUpdated } from "@/lib/dashboard-events";
import { toApiError } from "@/lib/errors";
import { toastError, toastSuccess } from "@/lib/toast";
import type { Customer } from "@/types/customer";

export default function EditCustomerPage() {
  return (
    <DashboardLayout>
      <EditCustomer />
    </DashboardLayout>
  );
}

function EditCustomer() {
  const { t, money } = useI18n();
  const router = useRouter();
  const customerId = useParams<{ id: string }>().id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getCustomerById(customerId)
      .then(setCustomer)
      .catch(() => setFailed(true));
  }, [customerId]);

  async function handleRemove() {
    if (!customer) return;

    if (customer.totalDue > 0) {
      await Swal.fire({
        icon: "warning",
        title: t("customers.remove.blockedTitle"),
        text: t("customers.remove.blockedText", { name: customer.name, amount: money(customer.totalDue) }),
        confirmButtonText: t("common.done"),
        confirmButtonColor: "#059669",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: t("customers.remove.confirmTitle", { name: customer.name }),
      text: t("customers.remove.confirmText"),
      showCancelButton: true,
      confirmButtonText: t("customers.remove.confirm"),
      cancelButtonText: t("common.cancel"),
      confirmButtonColor: "#e11d48",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteCustomer(customer._id);
      notifyDashboardUpdated();
      toastSuccess(t("customers.remove.removed", { name: customer.name }));
      router.replace("/customers");
    } catch (err) {
      const apiError = toApiError(err);
      toastError(apiError.network ? t("common.networkError") : t("common.somethingWrong"));
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={`/customers/${customerId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {customer?.name ?? t("common.back")}
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        {failed ? (
          <p className="text-sm text-rose-700">{t("customers.detail.notFound")}</p>
        ) : !customer ? (
          <div className="h-80 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900">{t("customers.form.editTitle")}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("customers.form.editSubtitle", { name: customer.name })}
            </p>

            <div className="mt-6">
              <CustomerForm
                initial={{ name: customer.name, phone: customer.phone, address: customer.address }}
                submitLabel={t("customers.form.update")}
                submittingLabel={t("common.saving")}
                onSubmit={async (data) => {
                  await updateCustomer(customer._id, data);
                  toastSuccess(t("customers.form.updated"));
                  router.replace(`/customers/${customer._id}`);
                }}
              />
            </div>
          </>
        )}
      </div>

      {customer && (
        <button
          type="button"
          onClick={handleRemove}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" /> {t("customers.remove.button")}
        </button>
      )}
    </div>
  );
}
