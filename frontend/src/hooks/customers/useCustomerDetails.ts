"use client";

import { useCallback, useEffect, useState } from "react";

import { getCustomer, getCustomerTransactions } from "@/services/customer.service";
import type { Customer } from "@/types/customer";
import type { Transaction, TransactionPagination } from "@/types/transaction";

export interface TransactionSummary {
  totalCredit: number;
  totalPayment: number;
  creditCount: number;
  paymentCount: number;
}

const PAGE_SIZE = 20;

/** Customer + first page of history. Never throws. */
async function fetchDetails(customerId: string) {
  try {
    const [customer, history] = await Promise.all([
      getCustomer(customerId) as Promise<Customer>,
      getCustomerTransactions(customerId, 1, PAGE_SIZE),
    ]);

    return { ok: true as const, customer, history };
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;

    return {
      ok: false as const,
      error: status === 404 || status === 400 ? ("not_found" as const) : ("failed" as const),
    };
  }
}

export function useCustomerDetails(customerId: string) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState<TransactionPagination | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<"not_found" | "failed" | null>(null);

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchDetails>>) => {
    if (result.ok) {
      setCustomer(result.customer);
      setTransactions(result.history.data ?? []);
      setSummary(result.history.summary ?? null);
      setPagination(result.history.pagination ?? null);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  /** Reloads the customer and the first page of history (after any change). */
  const reload = useCallback(async () => {
    apply(await fetchDetails(customerId));
  }, [customerId, apply]);

  useEffect(() => {
    if (!customerId) return;

    let cancelled = false;

    fetchDetails(customerId).then((result) => {
      if (!cancelled) apply(result);
    });

    return () => {
      cancelled = true;
    };
  }, [customerId, apply]);

  const hasMore = !!pagination && pagination.page < pagination.totalPages;

  async function loadMore() {
    if (!pagination || !hasMore || loadingMore) return;

    setLoadingMore(true);

    try {
      const next = await getCustomerTransactions(customerId, pagination.page + 1, PAGE_SIZE);
      setTransactions((current) => [...current, ...(next.data ?? [])]);
      setPagination(next.pagination);
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    customer,
    transactions,
    summary,
    loading,
    error,
    reload,
    hasMore,
    loadingMore,
    loadMore,
  };
}
