import api from "./api";

export interface DashboardStats {
  totalCustomers: number;
  totalCredit: number;
  totalPayment: number;
  totalBaki: number;
}

export async function getDashboardStats() {
  const response = await api.get("/dashboard/stats");

  return response.data.data as DashboardStats;
}