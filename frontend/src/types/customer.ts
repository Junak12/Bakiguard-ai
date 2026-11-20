export type AgingBucket = "notDue" | "d1_30" | "d31_60" | "d61_90" | "d90plus";

export type RiskBand = "new" | "low" | "medium" | "high";

export interface RiskReason {
  code: string;
  params: Record<string, string | number>;
  /** +1 helps, -1 hurts. */
  impact: -1 | 1;
}

export interface CustomerRisk {
  score: number;
  band: RiskBand;
  suggestedLimit: number;
  reasons: RiskReason[];
  updatedAt: string;
}

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
  lastRemindedAt?: string | null;

  /** Owner-set credit limit; null = use the suggested limit. */
  creditLimit?: number | null;

  /** Latest stored risk assessment (for list badges). */
  risk?: CustomerRisk | null;

  /** Secret for the customer's public statement link (/s/<token>). */
  statementToken?: string;

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
