"use client";

import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({
  onMenuClick,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 md:flex">
          <Search
            size={17}
            className="text-zinc-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-48 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />

          <span className="rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-400">
            ⌘ K
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4">
        <button className="relative rounded-xl p-2.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
          <Bell size={19} />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="h-8 w-px bg-zinc-200" />

        <button className="flex items-center gap-3 rounded-xl p-1.5 pr-2 hover:bg-zinc-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
            J
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-zinc-900">
              Junak
            </p>

            <p className="text-xs text-zinc-400">
              Business Owner
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}