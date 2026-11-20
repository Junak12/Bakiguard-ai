"use client";

import { type FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { Copy, Crown, Link2, Loader2, Mail, MessageCircle, UserPlus } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import NoPermission from "@/components/layout/NoPermission";
import { usePermissions } from "@/hooks/usePermissions";
import { useSessionUser } from "@/hooks/useSessionUser";
import { useI18n } from "@/i18n/I18nProvider";
import {
  changeMemberRole,
  getTeam,
  inviteMember,
  inviteUrl,
  removeMember,
  type StaffRole,
  type TeamMember,
} from "@/lib/business";
import { toApiError } from "@/lib/errors";
import { toastError, toastSuccess } from "@/lib/toast";

export default function TeamPage() {
  return (
    <DashboardLayout>
      <Guarded />
    </DashboardLayout>
  );
}

function Guarded() {
  const permissions = usePermissions();
  return permissions.canManageTeam ? <Team /> : <NoPermission />;
}

function Team() {
  const { t } = useI18n();
  const user = useSessionUser();

  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("staff");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [needsPro, setNeedsPro] = useState(false);
  // The link for the invite just created, shown until the owner moves on.
  const [newLink, setNewLink] = useState<{ email: string; url: string } | null>(null);

  const shopName = user?.shopName || user?.name || "";

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toastSuccess(t("team.linkCopied"));
    } catch {
      toastError(t("common.somethingWrong"));
    }
  }

  function whatsappHref(url: string) {
    return `https://wa.me/?text=${encodeURIComponent(t("team.whatsappText", { shop: shopName, link: url }))}`;
  }

  useEffect(() => {
    let active = true;
    getTeam()
      .then((data) => active && setMembers(data))
      .catch(() => active && setMembers([]));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNeedsPro(false);

    const clean = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError(t("team.errors.email"));
      return;
    }

    setSending(true);

    try {
      const token = await inviteMember(clean, role);
      toastSuccess(t("team.invited", { email: clean }));
      setNewLink({ email: clean, url: inviteUrl(token) });
      setEmail("");
      setReloadKey((key) => key + 1);
    } catch (err) {
      const apiError = toApiError(err);

      if (apiError.code === "PLAN_LIMIT_STAFF") {
        setNeedsPro(true);
      } else {
        setError(
          apiError.code === "ALREADY_INVITED"
            ? t("team.errors.already")
            : apiError.code === "INVITE_SELF"
              ? t("team.errors.self")
              : apiError.network
                ? t("common.networkError")
                : t("common.somethingWrong")
        );
      }
    } finally {
      setSending(false);
    }
  }

  async function handleRemove(member: TeamMember) {
    const result = await Swal.fire({
      icon: "warning",
      text: t("team.removeConfirm", { name: member.name ?? member.email }),
      showCancelButton: true,
      confirmButtonText: member.status === "active" ? t("team.remove") : t("team.cancelInvite"),
      cancelButtonText: t("common.cancel"),
      confirmButtonColor: "#e11d48",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await removeMember(member.id);
      setReloadKey((key) => key + 1);
    } catch {
      toastError(t("common.somethingWrong"));
    }
  }

  async function handleRole(member: TeamMember, next: StaffRole) {
    try {
      await changeMemberRole(member.id, next);
      setReloadKey((key) => key + 1);
    } catch {
      toastError(t("common.somethingWrong"));
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("team.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("team.subtitle")}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <UserPlus className="h-5 w-5 text-emerald-600" /> {t("team.inviteTitle")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{t("team.inviteHint")}</p>

        <form onSubmit={handleInvite} noValidate className="mt-4 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            {t("team.email")}
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("team.emailPlaceholder")}
                className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </span>
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">{t("team.role")}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(["staff", "manager"] as const).map((option) => (
                <label
                  key={option}
                  className={`cursor-pointer rounded-xl border p-3 text-sm transition ${
                    role === option ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option}
                    checked={role === option}
                    onChange={() => setRole(option)}
                    className="sr-only"
                  />
                  <span className="block font-semibold text-slate-900">{t(`team.roles.${option}`)}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{t(`team.roleHints.${option}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          {needsPro && (
            <p className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <Crown className="h-4 w-4 text-amber-500" /> {t("billing.limitStaff")}
              <Link href="/billing" className="font-semibold underline">
                {t("billing.upgradeCta")}
              </Link>
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-6"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sending ? t("team.inviting") : t("team.invite")}
          </button>
        </form>

        {newLink && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <Link2 className="h-4 w-4" /> {t("team.linkTitle")} · {newLink.email}
            </p>
            <p className="mt-2 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-600">{newLink.url}</p>
            <p className="mt-2 text-xs text-emerald-800">{t("team.linkHint")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={whatsappHref(newLink.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" /> {t("team.sendWhatsapp")}
              </a>
              <button
                type="button"
                onClick={() => void copy(newLink.url)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white"
              >
                <Copy className="h-4 w-4" /> {t("team.copyLink")}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 p-5 font-bold text-slate-900">{t("team.members")}</h2>
        <ul className="divide-y divide-slate-100">
          <li className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{t("team.you")}</p>
            </div>
          </li>

          {members === null ? (
            <li className="p-5">
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            </li>
          ) : members.length === 0 ? (
            <li className="p-5 text-sm text-slate-500">{t("team.empty")}</li>
          ) : (
            members.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600">
                  {(member.name ?? member.email).charAt(0).toUpperCase()}
                </div>
                {/* Name takes the first line on phones; controls wrap below it. */}
                <div className="min-w-0 flex-1 basis-[calc(100%-3.25rem)] sm:basis-auto">
                  <p className="truncate font-semibold text-slate-900">{member.name ?? member.email}</p>
                  <p className="truncate text-xs text-slate-500">
                    {member.status === "invited" ? t("team.pendingInvite") : member.email}
                  </p>
                </div>
                <select
                  value={member.role}
                  onChange={(event) => void handleRole(member, event.target.value as StaffRole)}
                  aria-label={t("team.role")}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
                >
                  <option value="staff">{t("team.roles.staff")}</option>
                  <option value="manager">{t("team.roles.manager")}</option>
                </select>
                {member.inviteToken && (
                  <button
                    type="button"
                    onClick={() => void copy(inviteUrl(member.inviteToken!))}
                    aria-label={t("team.copyLink")}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    <Copy className="h-4 w-4" /> {t("team.copyLink")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleRemove(member)}
                  className="rounded-lg px-2 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  {member.status === "active" ? t("team.remove") : t("team.cancelInvite")}
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
