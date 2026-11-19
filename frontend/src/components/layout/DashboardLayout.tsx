"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { restoreSession } from "@/lib/session";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const router = useRouter();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    // Uses the httpOnly refresh cookie to restore the session after a reload.
    restoreSession().then((signedIn) => {
      if (cancelled) return;

      if (!signedIn) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // --------------------------------------------------------
  // AUTH CHECKING
  // --------------------------------------------------------

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />

          <p className="text-sm text-zinc-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // PROTECTED DASHBOARD
  // --------------------------------------------------------

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* ================================================== */}
      {/* SIDEBAR */}
      {/* ================================================== */}

      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
      />

      {/* ================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================== */}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ================================================= */}
        {/* NAVBAR */}
        {/* ================================================= */}

        <Navbar
          onMenuClick={() =>
            setMobileOpen(true)
          }
        />

        {/* ================================================= */}
        {/* PAGE CONTENT */}
        {/* ================================================= */}

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}