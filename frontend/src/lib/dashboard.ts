import type { AgingBuckets } from "@/types/customer";

import api from "./api";

export interface DashboardStats {
  totalCustomers: number;
  totalCredit: number;
  totalPayment: number;
  totalBaki: number;
}

export interface AgingReport {
  asOf: string;
  totalOutstanding: number;
  totalOverdue: number;
  overdueCustomers: number;
  buckets: AgingBuckets;
}

export async function getDashboardStats() {
  const response = await api.get("/dashboard/stats");

  return response.data.data as DashboardStats;
}

export async function getAgingReport() {
  const response = await api.get("/dashboard/aging");

  return response.data.data as AgingReport;
}
