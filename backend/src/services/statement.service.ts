import { Customer } from "../model/Customer.js";
import { Transaction } from "../model/Transaction.js";
import { User } from "../model/User.js";
import { AppError } from "../utils/AppError.js";
import { getAgingReport } from "./ledger.service.js";

const STATEMENT_ROWS = 30;

/**
 * The customer-facing statement behind a share link.
 * Shows only this customer's own ledger and the shop's public details:
 * no ids, no other customers, nothing else about the shop's business.
 */
export async function getPublicStatement(token: string) {
  const notFound = () =>
    AppError.notFound(
      "This statement link is no longer valid. Please ask the shop for a new one."
    );

  const customer = await Customer.findOne(
    { statementToken: token, isArchived: false },
    { userId: 1, name: 1, totalDue: 1, nextDueAt: 1 }
  ).lean();

  if (!customer) throw notFound();

  const [shop, transactions, aging] = await Promise.all([
    User.findById(customer.userId, { name: 1, shopName: 1, paymentInfo: 1, language: 1 }).lean(),
    Transaction.find(
      { userId: customer.userId, customerId: customer._id },
      { _id: 0, type: 1, amount: 1, description: 1, dueDate: 1, outstanding: 1, createdAt: 1 }
    )
      .sort({ createdAt: -1 })
      .limit(STATEMENT_ROWS)
      .lean(),
    getAgingReport(String(customer.userId), String(customer._id)),
  ]);

  if (!shop) throw notFound();

  return {
    shop: {
      name: shop.shopName || shop.name,
      paymentInfo: shop.paymentInfo ?? null,
      language: shop.language ?? "bn",
    },
    customer: {
      name: customer.name,
      totalDue: customer.totalDue,
      nextDueAt: customer.nextDueAt ?? null,
      overdueAmount: aging.totalOverdue,
    },
    transactions,
    generatedAt: new Date().toISOString(),
  };
}
