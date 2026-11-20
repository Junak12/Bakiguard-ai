import mongoose from "mongoose";

import { Customer } from "../src/model/Customer.js";
import { Transaction } from "../src/model/Transaction.js";
import { backfillLedgers } from "../src/services/ledger.service.js";
import { api, createCustomer, recordTransaction, registerUser } from "./helpers.js";

const DAY_MS = 24 * 60 * 60 * 1000;

async function credits(customerId: string) {
  return Transaction.find({ customerId, type: "CREDIT" }).sort({ createdAt: 1 }).lean();
}

/** Moves a credit's due date into the past, as if time had passed. */
async function makeOverdue(transactionId: string, daysOverdue: number) {
  await Transaction.updateOne(
    { _id: transactionId },
    { $set: { dueDate: new Date(Date.now() - daysOverdue * DAY_MS) } }
  );
}

describe("due dates", () => {
  it("gives credits the shop's default term when no due date is sent", async () => {
    const { auth } = await registerUser();
    await api().patch("/api/auth/me").set(auth).send({ defaultCreditDays: 7 });
    const customer = await createCustomer(auth);

    const response = await recordTransaction(auth, customer._id, "CREDIT", 500);

    const due = new Date(response.body.data.dueDate).getTime();
    expect(Math.round((due - Date.now()) / DAY_MS)).toBe(7);
    expect(response.body.data.outstanding).toBe(500);
  });

  it("accepts an explicit due date and rejects one in the past", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);
    const inTenDays = new Date(Date.now() + 10 * DAY_MS).toISOString();

    const ok = await api()
      .post("/api/transactions")
      .set(auth)
      .send({ customerId: customer._id, type: "CREDIT", amount: 100, dueDate: inTenDays });
    expect(ok.status).toBe(201);
    expect(ok.body.data.dueDate).toBe(inTenDays);

    const past = await api()
      .post("/api/transactions")
      .set(auth)
      .send({
        customerId: customer._id,
        type: "CREDIT",
        amount: 100,
        dueDate: new Date(Date.now() - 5 * DAY_MS).toISOString(),
      });
    expect(past.status).toBe(400);

    const onPayment = await api()
      .post("/api/transactions")
      .set(auth)
      .send({ customerId: customer._id, type: "PAYMENT", amount: 50, dueDate: inTenDays });
    expect(onPayment.status).toBe(400);
  });

  it("payments settle the oldest credit first and move nextDueAt forward", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    const first = await recordTransaction(auth, customer._id, "CREDIT", 300);
    const second = await recordTransaction(auth, customer._id, "CREDIT", 500);

    let saved = await Customer.findById(customer._id).lean();
    expect(saved!.nextDueAt!.toISOString()).toBe(first.body.data.dueDate);

    await recordTransaction(auth, customer._id, "PAYMENT", 400);

    const [a, b] = await credits(customer._id);
    expect(a.outstanding).toBe(0);
    expect(b.outstanding).toBe(400);

    saved = await Customer.findById(customer._id).lean();
    expect(saved!.nextDueAt!.toISOString()).toBe(second.body.data.dueDate);

    await recordTransaction(auth, customer._id, "PAYMENT", 400);
    saved = await Customer.findById(customer._id).lean();
    expect(saved!.totalDue).toBe(0);
    expect(saved!.nextDueAt).toBeNull();
  });
});

describe("aging", () => {
  it("buckets unpaid money by days overdue", async () => {
    const { auth } = await registerUser();
    const a = await createCustomer(auth);
    const b = await createCustomer(auth);

    const fresh = await recordTransaction(auth, a._id, "CREDIT", 100);
    const late10 = await recordTransaction(auth, a._id, "CREDIT", 200);
    const late45 = await recordTransaction(auth, b._id, "CREDIT", 300);
    const late100 = await recordTransaction(auth, b._id, "CREDIT", 400);

    await makeOverdue(late10.body.data._id, 10);
    await makeOverdue(late45.body.data._id, 45);
    await makeOverdue(late100.body.data._id, 100);
    expect(fresh.status).toBe(201);

    const response = await api().get("/api/dashboard/aging").set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      totalOutstanding: 1000,
      totalOverdue: 900,
      overdueCustomers: 2,
      buckets: {
        notDue: { amount: 100, customers: 1 },
        d1_30: { amount: 200, customers: 1 },
        d31_60: { amount: 300, customers: 1 },
        d61_90: { amount: 0, customers: 0 },
        d90plus: { amount: 400, customers: 1 },
      },
    });

    // The total in the aging report always matches the customers' balances.
    const stats = await api().get("/api/dashboard/stats").set(auth);
    expect(stats.body.data.totalBaki).toBe(1000);
  });

  it("shows a customer's overdue amount and filters the overdue list", async () => {
    const { auth } = await registerUser();
    const late = await createCustomer(auth, { name: "Late Payer" });
    const onTime = await createCustomer(auth, { name: "On Time" });

    const credit = await recordTransaction(auth, late._id, "CREDIT", 700);
    await recordTransaction(auth, onTime._id, "CREDIT", 100);

    // Simulate time passing, then sync nextDueAt via a 0-impact path.
    await makeOverdue(credit.body.data._id, 20);
    await Customer.updateOne(
      { _id: late._id },
      { $set: { nextDueAt: new Date(Date.now() - 20 * DAY_MS) } }
    );

    const detail = await api().get(`/api/customers/${late._id}`).set(auth);
    expect(detail.body.data.overdueAmount).toBe(700);
    expect(detail.body.data.aging.d1_30.amount).toBe(700);

    const overdue = await api().get("/api/customers?status=overdue").set(auth);
    expect(overdue.body.data.map((c: { name: string }) => c.name)).toEqual(["Late Payer"]);

    const due = await api().get("/api/customers?status=due").set(auth);
    expect(due.body.data).toHaveLength(2);
  });
});

describe("backfill of ledgers recorded before due dates", () => {
  it("replays history FIFO and sets due dates 30 days after each credit", async () => {
    const userId = new mongoose.Types.ObjectId();
    const customer = await Customer.create({
      userId,
      name: "Old Customer",
      phone: "01799999999",
      totalDue: 250,
    });

    const t0 = Date.now() - 50 * DAY_MS;
    // Inserted raw, the way pre-Phase-1 data looks (no outstanding/dueDate).
    await Transaction.collection.insertMany([
      { userId, customerId: customer._id, type: "CREDIT", amount: 300, createdAt: new Date(t0), updatedAt: new Date(t0) },
      { userId, customerId: customer._id, type: "CREDIT", amount: 200, createdAt: new Date(t0 + DAY_MS), updatedAt: new Date(t0 + DAY_MS) },
      { userId, customerId: customer._id, type: "PAYMENT", amount: 250, createdAt: new Date(t0 + 2 * DAY_MS), updatedAt: new Date(t0 + 2 * DAY_MS) },
    ]);

    await backfillLedgers();

    const [first, second] = await credits(String(customer._id));
    expect(first.outstanding).toBe(50);
    expect(second.outstanding).toBe(200);
    expect(first.dueDate!.getTime()).toBe(t0 + 30 * DAY_MS);

    const saved = await Customer.findById(customer._id).lean();
    expect(saved!.nextDueAt!.getTime()).toBe(t0 + 30 * DAY_MS);

    // Running again changes nothing.
    await backfillLedgers();
    const [again] = await credits(String(customer._id));
    expect(again.outstanding).toBe(50);
  });
});
