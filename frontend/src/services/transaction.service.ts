import api from "@/lib/api";
import type { TransactionsResponse, TransactionType } from "@/types/transaction";

export interface TransactionQuery {
  page?: number;
  limit?: number;
  type?: TransactionType;
  /** Customer name or phone. */
  search?: string;
  /** ISO date-times, inclusive. */
  from?: string;
  to?: string;
}

/** Shop-wide history; all filtering happens on the server across every page. */
export async function getTransactions(query: TransactionQuery = {}) {
  const response = await api.get<TransactionsResponse>("/transactions", {
    params: { page: 1, limit: 10, ...query },
  });

  return response.data;
}
