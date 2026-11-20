"use client";

import Swal from "sweetalert2";
import { Store } from "lucide-react";

import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import { leaveShop } from "@/lib/business";
import { refreshAccessToken } from "@/lib/session";

/** For staff: which shop they're working in, and a way to leave it. */
export default function ShopBanner() {
  const { t } = useI18n();
  const user = useSessionUser();

  if (!user || user.role === "owner") return null;

  const shop = user.shopName || user.ownerName;

  async function leave() {
    const result = await Swal.fire({
      icon: "warning",
      text: t("team.leaveConfirm", { shop }),
      showCancelButton: true,
      confirmButtonText: t("team.leave"),
      cancelButtonText: t("common.cancel"),
      confirmButtonColor: "#e11d48",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    await leaveShop();
    await refreshAccessToken();
    // Full reload on purpose: every page must reset under the new shop.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/dashboard");
  }

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 print:hidden">
      <span className="flex items-center gap-2">
        <Store className="h-4 w-4" />
        {t("team.workingIn", { shop, role: t(user.role === "manager" ? "team.roles.manager" : "team.roles.staff") })}
      </span>
      <button type="button" onClick={() => void leave()} className="font-semibold underline">
        {t("team.leave")}
      </button>
    </div>
  );
}
