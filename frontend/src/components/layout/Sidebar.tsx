"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  BellRing,
  BrainCircuit,
  CreditCard,
  UsersRound,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";
import { useI18n, type TranslationKey } from "@/i18n/I18nProvider";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

type Permission = "canSeeReports" | "canManageTeam" | "canManageBilling";

const navigation: { label: TranslationKey; href: string; icon: typeof Users; needs?: Permission }[] = [
  { label: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "collections.nav", href: "/collections", icon: BellRing },
  { label: "nav.customers", href: "/customers", icon: Users },
  { label: "nav.transactions", href: "/transactions", icon: ArrowLeftRight },
  { label: "nav.aiInsights", href: "/ai-insights", icon: BrainCircuit },
  { label: "reports.nav", href: "/reports", icon: BarChart3, needs: "canSeeReports" },
  { label: "team.nav", href: "/team", icon: UsersRound, needs: "canManageTeam" },
  { label: "billing.nav", href: "/billing", icon: CreditCard, needs: "canManageBilling" },
  { label: "nav.settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const permissions = usePermissions();

  return (
    <>
      {mobileOpen && (
        <div onClick={onClose} className="fixed inset-0 z-40 bg-black/40 lg:hidden" aria-hidden />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col print:hidden border-r border-zinc-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-100 px-5 sm:h-20">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-zinc-900">{t("common.appName")}</p>
              <p className="text-[11px] font-medium text-zinc-400">{t("common.tagline")}</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation
            .filter(({ needs }) => !needs || permissions[needs])
            .map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{t(label)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-100 p-4">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-900">{t("nav.sidebarPromoTitle")}</p>
            <p className="mt-1 text-xs leading-5 text-emerald-700">{t("nav.sidebarPromoText")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
