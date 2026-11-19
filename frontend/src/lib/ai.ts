import api from "./api";


export interface AIInsight {
  type:
    | "warning"
    | "customer"
    | "positive"
    | "info";

  title: string;

  message: string;

  customer?: string;
}


export interface AIDashboardInsights {
  insights: AIInsight[];

  summary: {
    total_customers: number;
    total_credit: number;
    total_payment: number;
    total_baki: number;
  };
}


export async function getDashboardAIInsights() {
  const response = await api.get(
    "/ai/dashboard-insights"
  );

  return response.data
    .data as AIDashboardInsights;
}