"use client";

import { useEffect, useState } from "react";

import { getTransactions, type TransactionQuery } from "@/services/transaction.service";
import type { Transaction, TransactionPagination } from "@/types/transaction";

/** Loads one page of shop-wide transactions; refetches when the query changes. */
export function useTransactions(query: TransactionQuery, reloadKey = 0) {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [pagination, setPagination] = useState<TransactionPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const key = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;

    // Debounce so typing a search doesn't send a request per keystroke.
    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const response = await getTransactions(JSON.parse(key) as TransactionQuery);
        if (cancelled) return;
        setTransactions(response.data);
        setPagination(response.pagination);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, reloadKey]);

  return { transactions, pagination, loading, error };
}
