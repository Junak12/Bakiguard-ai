import type { CustomerRisk } from "@/types/customer";

import api from "./api";

export interface CustomerRiskResult {
  risk: CustomerRisk | null;
  /** Limit set by the owner; null = using the suggestion. */
  creditLimit: number | null;
  /** The limit in force (owner's, else suggested). */
  effectiveLimit: number | null;
}

export interface RiskOverviewItem {
  customer: { _id: string; name: string; phone: string; totalDue: number; creditLimit: number | null };
  risk: CustomerRisk;
  effectiveLimit: number | null;
}

/** Fresh risk score for one customer (computed on request). */
export async function getCustomerRisk(customerId: string) {
  const response = await api.get<{ data: CustomerRiskResult }>(`/customers/${customerId}/risk`);
  return response.data.data;
}

/** Every customer with history, riskiest first. */
export async function getRiskOverview() {
  const response = await api.get<{
    data: RiskOverviewItem[];
    summary: Record<CustomerRisk["band"], number>;
  }>("/risk");
  return response.data;
}

/** Owner's credit limit; null goes back to the suggested limit. */
export async function setCreditLimit(customerId: string, creditLimit: number | null) {
  await api.patch(`/customers/${customerId}`, { creditLimit });
}
