"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  BrainCircuit,
  Settings,
  WalletCards,
  X,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    name: "AI Insights",
    href: "/ai-insights",
    icon: BrainCircuit,
  },
];

export default function Sidebar({
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-zinc-200 bg-white
          transition-transform duration-300
          lg:static lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-zinc-100 px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900">
              <WalletCards
                size={20}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900">
                BakiGuard
              </h1>

              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
                Smart Ledger
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Workspace
          </p>

          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 rounded-xl px-3 py-2.5
                    text-sm font-medium transition
                    ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }
                  `}
                >
                  <Icon size={18} strokeWidth={1.8} />

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            System
          </p>

          <Link
            href="/settings"
            onClick={onClose}
            className={`
              flex items-center gap-3 rounded-xl px-3 py-2.5
              text-sm font-medium transition
              ${
                pathname.startsWith("/settings")
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }
            `}
          >
            <Settings size={18} strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Bottom */}
        <div className="border-t border-zinc-100 p-4">
          <div className="rounded-xl bg-zinc-50 p-4">
            <p className="text-xs font-semibold text-zinc-900">
              BakiGuard AI
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Smart insights for your business.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}