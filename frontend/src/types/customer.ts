export type AgingBucket = "notDue" | "d1_30" | "d31_60" | "d61_90" | "d90plus";

export type AgingBuckets = Record<AgingBucket, { amount: number; customers: number }>;

export interface Customer {
  _id: string;
  userId: string;

  name: string;
  phone: string;
  address?: string;

  /** Current Baki in whole Taka. */
  totalDue: number;

  /** Earliest due date among unpaid credits; null when nothing is owed. */
  nextDueAt?: string | null;
  lastCreditAt?: string;
  lastPaymentAt?: string;

  /** Only on the single-customer endpoint. */
  overdueAmount?: number;
  aging?: AgingBuckets;

  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  address?: string;
}

/** Has money past its due date. */
export function isOverdue(customer: Pick<Customer, "nextDueAt" | "totalDue">) {
  return (
    customer.totalDue > 0 &&
    !!customer.nextDueAt &&
    new Date(customer.nextDueAt).getTime() < Date.now()
  );
}
