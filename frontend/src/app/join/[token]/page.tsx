"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Store, UserPlus } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import { joinShop, previewInvite, type InvitePreview } from "@/lib/business";
import { toApiError } from "@/lib/errors";
import { refreshAccessToken } from "@/lib/session";
import { toastSuccess } from "@/lib/toast";

/**
 * Opened from an invite link the owner sent. DashboardLayout makes the person
 * log in or sign up first and brings them back here.
 */
export default function JoinPage() {
  return (
    <DashboardLayout>
      <Join />
    </DashboardLayout>
  );
}

function Join() {
  const { t } = useI18n();
  const user = useSessionUser();
  const { token } = useParams<{ token: string }>();

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    previewInvite(token)
      .then((data) => active && setInvite(data))
      .catch(() => active && setInvalid(true));
    return () => {
      active = false;
    };
  }, [token]);

  async function join() {
    if (!invite) return;
    setJoining(true);
    setError("");

    try {
      await joinShop(token);
      toastSuccess(t("team.joined", { shop: invite.shopName }));
      await refreshAccessToken();
      // Full reload: the whole app switches to the shop's khata.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/dashboard");
    } catch (err) {
      const apiError = toApiError(err);
      setError(
        apiError.code === "HAS_OWN_SHOP"
          ? t("team.joinBlocked")
          : apiError.status === 404
            ? t("team.joinInvalid")
            : t("common.somethingWrong")
      );
      setJoining(false);
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <UserPlus className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">{t("team.joinPageTitle")}</h1>

      {invalid ? (
        <p className="mt-3 text-sm text-slate-600">{t("team.joinInvalid")}</p>
      ) : !invite ? (
        <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-slate-400" />
      ) : (
        <>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600">
            <Store className="h-4 w-4 shrink-0" />
            {t("team.joinText", {
              owner: invite.ownerName,
              shop: invite.shopName,
              role: t(invite.role === "manager" ? "team.roles.manager" : "team.roles.staff"),
            })}
          </p>
          {user && <p className="mt-2 text-xs text-slate-400">{user.email}</p>}

          {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={() => void join()}
            disabled={joining}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            {joining && <Loader2 className="h-5 w-5 animate-spin" />}
            {t("team.join")}
          </button>
        </>
      )}
    </div>
  );
}
