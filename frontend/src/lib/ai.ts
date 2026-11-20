import api from "./api";

export type AIInsightCode =
  | "overdue_baki"
  | "outstanding_baki"
  | "top_customer"
  | "payment_activity"
  | "getting_started";

export interface AIInsight {
  type: "warning" | "customer" | "positive" | "info";
  /** Stable id the app translates; `title`/`message` are English fallbacks. */
  code?: AIInsightCode | string;
  params?: Record<string, string | number>;
  title: string;
  message: string;
  customer?: string;
}

export interface AIDashboardInsights {
  insights: AIInsight[];
  /** false when the AI service was unreachable (insights is then empty). */
  available: boolean;
}

export async function getDashboardAIInsights() {
  const response = await api.get("/ai/dashboard-insights");

  return response.data.data as AIDashboardInsights;
}
