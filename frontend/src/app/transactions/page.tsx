"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";

import TransactionFilters from "@/components/transactions/TransactionFilters";
import TransactionTable from "@/components/transactions/TransactionTable";
import TransactionErrorState from "@/components/transactions/TransactionErrorState";

import { TransactionType } from "@/types/transaction";

import { useTransactions } from "@/hooks/transactions/useTransactions";

export default function TransactionsPage() {
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<"ALL" | TransactionType>("ALL");

  /* =====================================================
     FETCH TRANSACTIONS
  ===================================================== */

  const { transactions, pagination, loading, error, refetch } = useTransactions(
    page,
    10,
  );

  /* =====================================================
     FILTER TRANSACTIONS
  ===================================================== */

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const customerName = transaction.customerId?.name ?? "";

      const description = transaction.description ?? "";

      const matchesSearch =
        customerName.toLowerCase().includes(normalizedSearch) ||
        description.toLowerCase().includes(normalizedSearch);

      const matchesType =
        typeFilter === "ALL" || transaction.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  /* =====================================================
     SEARCH HANDLER
  ===================================================== */

  const handleSearchChange = (value: string) => {
    setSearch(value);

    // Reset pagination when search changes
    setPage(1);
  };

  /* =====================================================
     TYPE FILTER HANDLER
  ===================================================== */

  const handleTypeChange = (value: "ALL" | TransactionType) => {
    setTypeFilter(value);

    // Reset pagination when filter changes
    setPage(1);
  };

  /* =====================================================
     PAGINATION HANDLER
  ===================================================== */

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) {
      return;
    }

    setPage(nextPage);
  };

  /* =====================================================
     FILTER STATE
  ===================================================== */

  const hasFilters = search.trim().length > 0 || typeFilter !== "ALL";

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <DashboardLayout>
      <main className="space-y-6">
        {/* =================================================
            HERO HEADER
        ================================================= */}

        {/* =================================================
    HERO HEADER
================================================= */}

<section
  className="
    relative
    overflow-hidden
    rounded-[28px]
    border
    border-purple-300/30
    bg-gradient-to-r
    from-purple-800
    via-indigo-800
    to-slate-950
    px-6
    py-6
    shadow-lg
    shadow-purple-900/10

    sm:px-10
    sm:py-7
  "
>
  {/* Purple glow */}
  <div
    className="
      pointer-events-none
      absolute
      -left-20
      -top-24
      h-72
      w-72
      rounded-full
      bg-purple-500/30
      blur-3xl
    "
  />

  {/* Blue glow */}
  <div
    className="
      pointer-events-none
      absolute
      left-1/2
      top-1/2
      h-64
      w-64
      -translate-x-1/2
      -translate-y-1/2
      rounded-full
      bg-blue-500/20
      blur-3xl
    "
  />

  {/* Right glow */}
  <div
    className="
      pointer-events-none
      absolute
      -bottom-24
      -right-16
      h-72
      w-72
      rounded-full
      bg-fuchsia-500/20
      blur-3xl
    "
  />

  {/* Content */}
  <div
    className="
      relative
      z-10
      flex
      flex-col
      gap-4

      sm:flex-row
      sm:items-end
      sm:justify-between
    "
  >
    {/* LEFT */}
    <div>
      {/* Badge */}
      <div
        className="
          mb-3
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-white/20
          bg-white/10
          px-4
          py-2
          text-xs
          font-bold
          uppercase
          tracking-wider
          text-white
          backdrop-blur-sm
        "
      >
        <span className="text-base">✨</span>
        Vibrant CRM
        <span className="text-white/40">•</span>
        Transactions
      </div>

      {/* Heading */}
      <h1
        className="
          text-3xl
          font-black
          leading-[1.05]
          tracking-tight
          text-white

          sm:text-5xl
        "
      >
        Transaction{" "}
        <span
          className="
            bg-gradient-to-r
            from-amber-300
            via-pink-300
            to-cyan-300
            bg-clip-text
            text-transparent
          "
        >
          History
        </span>
      </h1>

      {/* Description */}
      <p
        className="
          mt-2
          max-w-2xl
          text-sm
          leading-6
          text-white/75

          sm:text-base
        "
      >
        Track customer credits, payments, and account activity with a
        clear view of your transaction history.
      </p>
    </div>

    {/* REFRESH */}
    <button
      type="button"
      onClick={refetch}
      disabled={loading}
      className="
        relative
        inline-flex
        h-10
        shrink-0
        items-center
        justify-center
        gap-2
        rounded-xl
        border
        border-white/20
        bg-white/10
        px-4
        text-sm
        font-semibold
        text-white
        backdrop-blur-sm
        transition-all

        hover:bg-white/15
        active:scale-[0.98]

        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <RefreshCw
        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
      />
      Refresh
    </button>
  </div>
</section>
        {/* =================================================
            FILTERS
        ================================================= */}

        <TransactionFilters
          search={search}
          typeFilter={typeFilter}
          onSearchChange={handleSearchChange}
          onTypeChange={handleTypeChange}
        />

        {/* =================================================
            ERROR STATE
        ================================================= */}

        {error && (
          <TransactionErrorState
            error={error}
            onRetry={refetch}
            loading={loading}
          />
        )}

        {/* =================================================
            TRANSACTION TABLE
        ================================================= */}

        <TransactionTable
          transactions={filteredTransactions}
          loading={loading}
          total={pagination.total}
          page={pagination.page}
          totalPages={pagination.totalPages}
          hasFilters={hasFilters}
          onPageChange={handlePageChange}
        />
      </main>
    </DashboardLayout>
  );
}
