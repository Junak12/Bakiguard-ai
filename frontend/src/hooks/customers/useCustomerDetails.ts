"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getCustomer,
  getCustomerTransactions,
} from "@/services/customer.service";

import { Customer } from "@/types/customer";

import {
  Transaction,
  TransactionPagination,
} from "@/types/transaction";

export function useCustomerDetails(
  customerId: string
) {
  const [customer, setCustomer] =
    useState<Customer | null>(null);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [transactionPagination, setTransactionPagination] =
    useState<TransactionPagination>({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================================
  // LOAD CUSTOMER
  // =========================================================

  const loadCustomer = useCallback(
    async () => {
      const data =
        await getCustomer(customerId);

      setCustomer(data);
    },
    [customerId]
  );

  // =========================================================
  // LOAD TRANSACTIONS
  // =========================================================

  const loadTransactions = useCallback(
    async (
      page = 1,
      limit = 10
    ) => {
      const response =
        await getCustomerTransactions(
          customerId,
          page,
          limit
        );

      setTransactions(
        response.data || []
      );

      setTransactionPagination(
        response.pagination
      );
    },
    [customerId]
  );

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  const loadCustomerData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          loadCustomer(),
          loadTransactions(1, 10),
        ]);
      } catch (error: any) {
        console.error(error);

        setError(
          error?.response?.data?.message ||
            "Unable to load customer details."
        );
      } finally {
        setLoading(false);
      }
    }, [
      loadCustomer,
      loadTransactions,
    ]);

  useEffect(() => {
    if (!customerId) return;

    loadCustomerData();
  }, [
    customerId,
    loadCustomerData,
  ]);

  // =========================================================
  // CHANGE TRANSACTION PAGE
  // =========================================================

  async function changeTransactionPage(
    page: number
  ) {
    if (
      page < 1 ||
      page >
        transactionPagination.totalPages
    ) {
      return;
    }

    try {
      await loadTransactions(
        page,
        transactionPagination.limit
      );
    } catch (error) {
      console.error(error);
    }
  }

  // =========================================================
  // RELOAD
  // =========================================================

  async function reload() {
    await loadCustomerData();
  }

  return {
    customer,

    transactions,

    transactionPagination,

    loading,

    error,

    reload,

    changeTransactionPage,
  };
}