"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { adoptAccountLanguage, useI18n } from "@/i18n/I18nProvider";
import { getCurrentUser, restoreSession } from "@/lib/session";

import Navbar from "./Navbar";
import ShopBanner from "./ShopBanner";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { t } = useI18n();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Uses the httpOnly refresh cookie to restore the session after a reload.
    restoreSession().then((signedIn) => {
      if (cancelled) return;

      if (!signedIn) {
        router.replace("/login");
        return;
      }

      adoptAccountLanguage(getCurrentUser()?.language);
      setCheckingAuth(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm text-slate-500">{t("nav.checkingSession")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-400">
            <ShopBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
