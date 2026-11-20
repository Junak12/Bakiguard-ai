"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Menu, Search, Settings, X } from "lucide-react";

import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";
import { getCustomers } from "@/lib/customer";
import { useSessionUser } from "@/hooks/useSessionUser";
import { logout } from "@/lib/session";
import type { Customer } from "@/types/customer";

interface NavbarProps {
  onMenuClick: () => void;
}

function initial(name: string | undefined) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { t, money } = useI18n();

  // DashboardLayout only renders us after the session is restored.
  const user = useSessionUser();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Debounced server-side search.
  useEffect(() => {
    const query = search.trim();

    if (!query) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearching(true);

      try {
        const customers = await getCustomers({ search: query });
        if (!cancelled) setResults(customers.slice(0, 8));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  // Close popovers on outside click.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setShowResults(false);
      if (profileRef.current && !profileRef.current.contains(target)) setShowProfileMenu(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openCustomer(id: string) {
    setSearch("");
    setShowResults(false);
    router.push(`/customers/${id}`);
  }

  async function handleSignOut() {
    setSigningOut(true);

    try {
      // Tokens left behind by older versions of the app.
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      await logout();
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      router.replace("/login");
    }
  }

  const query = search.trim();

  return (
    <header className="sticky top-0 z-30 print:hidden flex h-16 w-full items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-3 shadow-sm backdrop-blur-xl sm:h-20 sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={t("nav.openMenu")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:scale-95 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div ref={searchRef} className="relative">
          <div className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 sm:flex md:w-70 lg:w-96">
            {searching ? (
              <Loader2 size={17} className="shrink-0 animate-spin text-emerald-600" />
            ) : (
              <Search size={17} className="shrink-0 text-slate-400" />
            )}

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => query && setShowResults(true)}
              placeholder={t("nav.searchPlaceholder")}
              aria-label={t("nav.searchLabel")}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setShowResults(false);
                }}
                aria-label={t("common.close")}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {showResults && query && (
            <div className="absolute left-0 top-14 z-50 w-[calc(100vw-24px)] max-w-95 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:w-95">
              <p className="truncate border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
                {t("nav.searchResults", { query })}
              </p>

              {searching && results.length === 0 ? (
                <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                  <Loader2 size={17} className="animate-spin text-emerald-600" />
                  {t("nav.searching")}
                </p>
              ) : results.length > 0 ? (
                <div className="max-h-90 overflow-y-auto p-2">
                  {results.map((customer) => (
                    <button
                      key={customer._id}
                      type="button"
                      onClick={() => openCustomer(customer._id)}
                      className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-emerald-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">
                        {initial(customer.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{customer.name}</p>
                        <p className="truncate text-xs text-slate-500">{customer.phone}</p>
                      </div>
                      <p
                        className={`shrink-0 text-xs font-bold ${
                          customer.totalDue > 0 ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {customer.totalDue > 0
                          ? t("nav.owes", { amount: money(customer.totalDue) })
                          : t("nav.settled")}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-800">{t("nav.noResults")}</p>
                  <p className="mt-1 text-xs text-slate-500">{t("nav.noResultsHint")}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/customers")}
          aria-label={t("nav.searchLabel")}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 sm:hidden"
        >
          <Search size={19} />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <LanguageToggle />

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu((value) => !value)}
            aria-expanded={showProfileMenu}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 sm:gap-3 sm:pr-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white sm:h-10 sm:w-10">
              {initial(user?.name)}
            </div>
            <div className="hidden text-left md:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-900">{user?.name}</p>
              <p className="max-w-40 truncate text-[11px] text-slate-400">
                {user?.shopName || t("nav.owner")}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
              <div className="border-b border-slate-100 bg-slate-50/80 p-4">
                <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {user?.shopName || user?.phone || user?.email}
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push("/settings");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Settings size={17} />
                  {t("nav.settings")}
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  {signingOut ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
                  {signingOut ? t("nav.signingOut") : t("nav.signOut")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
