"use client";

import { ReactNode, useState } from "react";


import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}