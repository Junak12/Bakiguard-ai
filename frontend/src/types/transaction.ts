export type TransactionType =
  | "CREDIT"
  | "PAYMENT";

export interface TransactionCustomer {
  _id: string;
  name: string;
  phone?: string;
}

export interface Transaction {
  _id: string;
  customerId: TransactionCustomer;
  type: TransactionType;
  amount: number;
  description?: string;
  /** CREDIT only. */
  dueDate?: string;
  /** CREDIT only: part not yet paid back. */
  outstanding?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: TransactionPagination;
}