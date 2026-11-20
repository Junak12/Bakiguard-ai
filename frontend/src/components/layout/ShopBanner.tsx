"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Store, UserPlus } from "lucide-react";

import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import { acceptInvite, getMyInvites, leaveShop, type Invite } from "@/lib/business";
import { toApiError } from "@/lib/errors";
import { refreshAccessToken } from "@/lib/session";
import { toastError, toastSuccess } from "@/lib/toast";

/**
 * Staff: which shop they're working in (and a way to leave).
 * Owners: pending invitations to join someone else's shop.
 */
export default function ShopBanner() {
  const { t } = useI18n();
  const user = useSessionUser();
  const [invites, setInvites] = useState<Invite[]>([]);

  const isOwner = user?.role === "owner";

  useEffect(() => {
    if (!isOwner) return;

    let active = true;
    getMyInvites()
      .then((data) => active && setInvites(data))
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [isOwner]);

  async function join(invite: Invite) {
    try {
      await acceptInvite(invite.id);
      toastSuccess(t("team.joined", { shop: invite.shopName }));
      // New role and shop: reload everything under the new context.
      await refreshAccessToken();
      // Full reload on purpose: every page must reset under the new shop.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/dashboard");
    } catch (err) {
      const apiError = toApiError(err);
      toastError(apiError.code === "HAS_OWN_SHOP" ? t("team.joinBlocked") : t("common.somethingWrong"));
    }
  }

  async function leave() {
    const shop = user?.shopName || user?.ownerName || "";
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
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/dashboard");
  }

  if (!user) return null;

  if (!isOwner) {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 print:hidden">
        <span className="flex items-center gap-2">
          <Store className="h-4 w-4" />
          {t("team.workingIn", {
            shop: user.shopName || user.ownerName,
            role: t(`team.roles.${user.role}`),
          })}
        </span>
        <button type="button" onClick={() => void leave()} className="font-semibold underline">
          {t("team.leave")}
        </button>
      </div>
    );
  }

  if (invites.length === 0) return null;

  return (
    <div className="mb-5 space-y-2 print:hidden">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <span className="flex items-start gap-2">
            <UserPlus className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <strong>{t("team.joinTitle")}</strong>{" "}
              {t("team.joinText", {
                owner: invite.ownerName,
                shop: invite.shopName,
                role: t(`team.roles.${invite.role}`),
              })}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void join(invite)}
            className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white"
          >
            {t("team.join")}
          </button>
        </div>
      ))}
    </div>
  );
}
