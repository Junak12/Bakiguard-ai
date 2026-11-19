import { Customer } from "../model/Customer.js";
import { getOverdueByCustomer } from "./ledger.service.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A reminder within this window counts as "already reminded" for today's list. */
const RECENTLY_REMINDED_MS = 20 * 60 * 60 * 1000;

export type CollectionStatus = "overdue" | "due_soon";

export interface CollectionItem {
  customer: {
    _id: string;
    name: string;
    phone: string;
    totalDue: number;
    nextDueAt: Date | null;
    lastRemindedAt: Date | null;
    statementToken: string | null;
  };
  status: CollectionStatus;
  overdueAmount: number;
  daysLate: number;
  /** Days until the next due date (due_soon only). */
  dueInDays: number;
  remindedRecently: boolean;
}

/**
 * Today's collection list: who to ask for money, in order.
 *
 * 1. Overdue customers, by overdue amount weighted by how late it is
 *    (1,000 Taka that is 60 days late outranks 1,500 that is 2 days late).
 * 2. Customers whose Baki falls due within `days` days, soonest first.
 * Anyone already reminded in the last ~day drops below the rest.
 */
export async function getCollectionList(userId: string, days: number) {
  const now = Date.now();

  const customers = await Customer.find(
    {
      userId,
      isArchived: false,
      totalDue: { $gt: 0 },
      nextDueAt: { $ne: null, $lte: new Date(now + days * DAY_MS) },
    },
    { name: 1, phone: 1, totalDue: 1, nextDueAt: 1, lastRemindedAt: 1, statementToken: 1 }
  ).lean();

  const overdue = await getOverdueByCustomer(
    userId,
    customers.map((customer) => String(customer._id))
  );

  const items = customers.map((customer): CollectionItem & { score: number } => {
    const late = overdue.get(String(customer._id));
    const daysLate = late
      ? Math.max(1, Math.floor((now - late.oldestDueDate.getTime()) / DAY_MS))
      : 0;
    const dueInDays = customer.nextDueAt
      ? Math.max(0, Math.ceil((customer.nextDueAt.getTime() - now) / DAY_MS))
      : 0;

    return {
      customer: {
        _id: String(customer._id),
        name: customer.name,
        phone: customer.phone,
        totalDue: customer.totalDue,
        nextDueAt: customer.nextDueAt ?? null,
        lastRemindedAt: customer.lastRemindedAt ?? null,
        statementToken: customer.statementToken ?? null,
      },
      status: late ? "overdue" : "due_soon",
      overdueAmount: late?.overdueAmount ?? 0,
      daysLate,
      dueInDays,
      remindedRecently:
        !!customer.lastRemindedAt &&
        now - customer.lastRemindedAt.getTime() < RECENTLY_REMINDED_MS,
      score: late ? late.overdueAmount * (1 + daysLate / 30) : 0,
    };
  });

  items.sort((a, b) => {
    if (a.remindedRecently !== b.remindedRecently) return a.remindedRecently ? 1 : -1;
    if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
    if (a.status === "overdue") return b.score - a.score;
    return a.dueInDays - b.dueInDays;
  });

  const summary = {
    count: items.length,
    overdueCount: items.filter((item) => item.status === "overdue").length,
    dueSoonCount: items.filter((item) => item.status === "due_soon").length,
    totalOverdue: items.reduce((sum, item) => sum + item.overdueAmount, 0),
    totalToCollect: items.reduce((sum, item) => sum + item.customer.totalDue, 0),
    remindedRecently: items.filter((item) => item.remindedRecently).length,
  };

  return { items: items.map(({ score: _score, ...item }) => item), summary };
}
