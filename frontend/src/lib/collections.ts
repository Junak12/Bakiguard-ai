import api from "./api";

export interface CollectionItem {
  customer: {
    _id: string;
    name: string;
    phone: string;
    totalDue: number;
    nextDueAt: string | null;
    lastRemindedAt: string | null;
    statementToken: string | null;
  };
  status: "overdue" | "due_soon";
  overdueAmount: number;
  daysLate: number;
  dueInDays: number;
  remindedRecently: boolean;
}

export interface CollectionSummary {
  count: number;
  overdueCount: number;
  dueSoonCount: number;
  totalOverdue: number;
  totalToCollect: number;
  remindedRecently: number;
}

/** Today's collection list, in priority order (computed on the server). */
export async function getCollections(days = 3) {
  const response = await api.get<{ data: CollectionItem[]; summary: CollectionSummary }>(
    "/collections",
    { params: { days } }
  );

  return response.data;
}
