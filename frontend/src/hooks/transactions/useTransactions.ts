"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getTransactions,
} from "@/services/transaction.service";

import {
  Transaction,
  TransactionPagination,
} from "@/types/transaction";

export function useTransactions(
  page = 1,
  limit = 10
) {
  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [pagination, setPagination] =
    useState<TransactionPagination>({
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const fetchTransactions =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await getTransactions(
            page,
            limit
          );

        setTransactions(
          response.data || []
        );

        setPagination(
          response.pagination
        );
      } catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
            "Failed to load transactions."
        );
      } finally {
        setLoading(false);
      }
    }, [page, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    pagination,
    loading,
    error,
    refetch: fetchTransactions,
  };
}