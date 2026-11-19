"use client";

import {
  Bell,
  Menu,
  Search,
  LogOut,
  User,
  Loader2,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { getCustomers } from "@/lib/customer";
import { logout } from "@/lib/session";

interface NavbarProps {
  onMenuClick: () => void;
}

interface CustomerSearchResult {
  _id: string;
  name: string;
  phone?: string;
  totalDue?: number;
}

export default function Navbar({
  onMenuClick,
}: NavbarProps) {
  const router = useRouter();

  const searchRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<
    CustomerSearchResult[]
  >([]);

  const [searching, setSearching] =
    useState(false);

  const [showResults, setShowResults] =
    useState(false);

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const [signingOut, setSigningOut] =
    useState(false);

  /*
   * Search customers
   */
  useEffect(() => {
    const searchCustomers = async () => {
      const query = search.trim().toLowerCase();

      if (!query) {
        setCustomers([]);
        setShowResults(false);
        return;
      }

      try {
        setSearching(true);
        setShowResults(true);

        const data = await getCustomers();

        const filtered = data
          .filter((customer: CustomerSearchResult) => {
            const name =
              customer.name?.toLowerCase() || "";

            const phone =
              customer.phone?.toLowerCase() || "";

            return (
              name.includes(query) ||
              phone.includes(query)
            );
          })
          .slice(0, 8);

        setCustomers(filtered);
      } catch (error) {
        console.error(
          "Customer search failed:",
          error
        );

        setCustomers([]);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(
      searchCustomers,
      300
    );

    return () => clearTimeout(timer);
  }, [search]);

  /*
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target as Node
        )
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
   * Open customer
   */
  function handleCustomerClick(
    customerId: string
  ) {
    setSearch("");
    setShowResults(false);

    router.push(
      `/customers/${customerId}`
    );
  }

  /*
   * Sign out: revokes the session on the server and clears the
   * in-memory token. Redirects even if the network call fails.
   */
  async function handleSignOut() {
    try {
      setSigningOut(true);

      // Remove tokens left behind by older versions of the app.
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");

      await logout();
    } catch (error) {
      console.error(
        "Sign out failed:",
        error
      );
    } finally {
      setSigningOut(false);
      router.replace("/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 shadow-sm backdrop-blur-xl sm:h-20 sm:px-4 md:px-6">
      {/* =====================================================
          LEFT
      ====================================================== */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 lg:hidden"
        >
          <Menu size={21} />
        </button>

        {/* Search */}
        <div
          ref={searchRef}
          className="relative"
        >
          <div className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition-all focus-within:border-violet-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10 sm:flex md:w-[280px] lg:w-[340px]"
          >
            {searching ? (
              <Loader2
                size={17}
                className="shrink-0 animate-spin text-violet-500"
              />
            ) : (
              <Search
                size={17}
                className="shrink-0 text-slate-400"
              />
            )}

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onFocus={() => {
                if (search.trim()) {
                  setShowResults(true);
                }
              }}
              placeholder="Search customers..."
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setShowResults(false);
                }}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            )}

            <span className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 lg:block">
              ⌘ K
            </span>
          </div>

          {/* Search Results */}
          {showResults && search.trim() && (
            <div className="absolute left-0 top-14 z-50 w-[calc(100vw-24px)] max-w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 sm:w-[380px]">
              {/* Header */}
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Customer Search
                </p>

                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Results for "{search}"
                </p>
              </div>

              {/* Loading */}
              {searching && (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-slate-500">
                  <Loader2
                    size={17}
                    className="animate-spin text-violet-500"
                  />
                  Searching customers...
                </div>
              )}

              {/* Results */}
              {!searching &&
                customers.length > 0 && (
                  <div className="max-h-[360px] overflow-y-auto p-2">
                    {customers.map(
                      (customer) => (
                        <button
                          key={customer._id}
                          type="button"
                          onClick={() =>
                            handleCustomerClick(
                              customer._id
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-violet-50 active:scale-[0.99]"
                        >
                          {/* Avatar */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                            {customer.name
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          {/* Information */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {customer.name}
                            </p>

                            {customer.phone && (
                              <p className="mt-0.5 truncate text-xs text-slate-500">
                                {customer.phone}
                              </p>
                            )}
                          </div>

                          {/* Baki */}
                          {typeof customer.totalDue ===
                            "number" && (
                            <div className="shrink-0 text-right">
                              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                Baki
                              </p>

                              <p
                                className={`text-xs font-bold ${
                                  customer.totalDue >
                                  0
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                ৳
                                {customer.totalDue.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}

              {/* No Results */}
              {!searching &&
                customers.length === 0 && (
                  <div className="px-4 py-10 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                      <Search
                        size={19}
                        className="text-slate-400"
                      />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-800">
                      No customers found
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Try searching by name or phone
                      number.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => {
            /*
             * On very small screens we can redirect
             * to the customers page instead of forcing
             * a tiny search input.
             */
            router.push("/customers");
          }}
          aria-label="Search customers"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:hidden"
        >
          <Search size={19} />
        </button>
      </div>

      {/* =====================================================
          RIGHT
      ====================================================== */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-4">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <Bell size={19} />

          <span className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setShowProfileMenu(
                (value) => !value
              )
            }
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 active:scale-[0.98] sm:gap-3 sm:pr-2"
          >
            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-sm font-bold text-white shadow-sm sm:h-10 sm:w-10">
              J
            </div>

            {/* User Information */}
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold text-slate-900">
                Junak
              </p>

              <p className="text-[11px] font-medium text-slate-400">
                Business Owner
              </p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
              {/* User Header */}
              <div className="border-b border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-sm font-bold text-white">
                    J
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      Junak
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      Business Owner
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(
                      false
                    );

                    router.push(
                      "/profile"
                    );
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <User size={17} />

                  <span>
                    Profile Settings
                  </span>
                </button>

                {/* Sign Out */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signingOut ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <LogOut size={17} />
                  )}

                  <span>
                    {signingOut
                      ? "Signing out..."
                      : "Sign Out"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}