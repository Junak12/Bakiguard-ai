import mongoose from "mongoose";

import { Customer } from "../src/model/Customer.js";
import { Transaction } from "../src/model/Transaction.js";
import { aiClient } from "../src/services/ai.service.js";
import { backfillLedgers } from "../src/services/ledger.service.js";
import { api, createCustomer, recordTransaction, registerUser } from "./helpers.js";

const DAY_MS = 24 * 60 * 60 * 1000;

type Features = Record<string, number | string | null>;

/** Captures what the backend sends to the AI service and returns canned scores. */
function stubScoring(score: (f: Features) => { score: number; band: string; suggested_limit: number }) {
  const sent: Features[] = [];

  vi.spyOn(aiClient, "post").mockImplementation((async (_url: string, body: { customers: Features[] }) => {
    sent.push(...body.customers);
    return {
      data: {
        data: body.customers.map((f) => ({ id: f.id, reasons: [{ code: "test", params: {}, impact: -1 }], ...score(f) })),
      },
    };
  }) as never);

  return sent;
}

afterEach(() => vi.restoreAllMocks());

async function moveDue(transactionId: string, daysFromNow: number) {
  await Transaction.updateOne(
    { _id: transactionId },
    { $set: { dueDate: new Date(Date.now() + daysFromNow * DAY_MS) } }
  );
}

describe("settlement dates", () => {
  it("stamps settledAt only when a credit is fully paid", async () => {
    stubScoring(() => ({ score: 50, band: "medium", suggested_limit: 1000 }));
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    await recordTransaction(auth, customer._id, "CREDIT", 300);
    await recordTransaction(auth, customer._id, "CREDIT", 200);
    await recordTransaction(auth, customer._id, "PAYMENT", 400);

    const [first, second] = await Transaction.find({ customerId: customer._id, type: "CREDIT" })
      .sort({ createdAt: 1 })
      .lean();

    expect(first.outstanding).toBe(0);
    expect(first.settledAt).toBeInstanceOf(Date);
    expect(second.outstanding).toBe(100);
    expect(second.settledAt).toBeUndefined();
  });

  it("backfills settledAt for older ledgers from payment history", async () => {
    const userId = new mongoose.Types.ObjectId();
    const customer = await Customer.create({ userId, name: "Old", phone: "01788888888", totalDue: 0 });
    const t0 = Date.now() - 40 * DAY_MS;

    // Shape of data written before settledAt existed.
    await Transaction.collection.insertMany([
      { userId, customerId: customer._id, type: "CREDIT", amount: 500, outstanding: 0, dueDate: new Date(t0 + 10 * DAY_MS), createdAt: new Date(t0), updatedAt: new Date(t0) },
      { userId, customerId: customer._id, type: "PAYMENT", amount: 500, createdAt: new Date(t0 + 15 * DAY_MS), updatedAt: new Date(t0 + 15 * DAY_MS) },
    ]);

    await backfillLedgers();

    const credit = await Transaction.findOne({ customerId: customer._id, type: "CREDIT" }).lean();
    expect(credit!.settledAt!.getTime()).toBe(t0 + 15 * DAY_MS);
  });
});

describe("risk features", () => {
  it("measures on-time history, lateness now, and recency", async () => {
    const sent = stubScoring(() => ({ score: 30, band: "high", suggested_limit: 0 }));
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    // Credit 1: paid on time.
    await recordTransaction(auth, customer._id, "CREDIT", 100);
    await recordTransaction(auth, customer._id, "PAYMENT", 100);

    // Credit 2: due 10 days ago, then paid (10 days late).
    const late = await recordTransaction(auth, customer._id, "CREDIT", 200);
    await moveDue(late.body.data._id, -10);
    await recordTransaction(auth, customer._id, "PAYMENT", 200);

    // Credit 3: due 20 days ago, still unpaid.
    const unpaid = await recordTransaction(auth, customer._id, "CREDIT", 300);
    await moveDue(unpaid.body.data._id, -20);

    sent.length = 0;
    const response = await api().get(`/api/customers/${customer._id}/risk`).set(auth);

    expect(response.status).toBe(200);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      id: customer._id,
      total_due: 300,
      overdue_amount: 300,
      days_late_now: 20,
      credit_count: 3,
      settled_count: 2,
      settled_on_time_count: 1,
      avg_days_late_settled: 5, // (0 + 10) / 2
      total_credit: 600,
      total_paid: 300,
      days_since_last_payment: 0,
    });
  });

  it("scores a customer with no history as an empty profile", async () => {
    const sent = stubScoring(() => ({ score: 65, band: "new", suggested_limit: 2000 }));
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    const response = await api().get(`/api/customers/${customer._id}/risk`).set(auth);

    expect(response.body.data).toMatchObject({
      risk: { band: "new", suggestedLimit: 2000 },
      creditLimit: null,
      effectiveLimit: 2000,
    });
    expect(sent[0]).toMatchObject({ credit_count: 0, days_since_last_payment: null });
  });
});

describe("credit limits", () => {
  it("the owner's limit overrides the suggestion, and null restores it", async () => {
    stubScoring(() => ({ score: 80, band: "low", suggested_limit: 3000 }));
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    const set = await api().patch(`/api/customers/${customer._id}`).set(auth).send({ creditLimit: 5000 });
    expect(set.status).toBe(200);

    let risk = await api().get(`/api/customers/${customer._id}/risk`).set(auth);
    expect(risk.body.data).toMatchObject({ creditLimit: 5000, effectiveLimit: 5000 });

    await api().patch(`/api/customers/${customer._id}`).set(auth).send({ creditLimit: null });
    risk = await api().get(`/api/customers/${customer._id}/risk`).set(auth);
    expect(risk.body.data).toMatchObject({ creditLimit: null, effectiveLimit: 3000 });

    expect(
      (await api().patch(`/api/customers/${customer._id}`).set(auth).send({ creditLimit: 10.5 })).status
    ).toBe(400);
  });
});

describe("risk overview", () => {
  it("lists customers riskiest first with band counts, and stores the snapshot", async () => {
    stubScoring((f) =>
      Number(f.overdue_amount) > 0
        ? { score: 20, band: "high", suggested_limit: 0 }
        : Number(f.credit_count) === 0
          ? { score: 65, band: "new", suggested_limit: 2000 }
          : { score: 85, band: "low", suggested_limit: 4000 }
    );

    const { auth } = await registerUser();
    const good = await createCustomer(auth, { name: "Good Payer" });
    const bad = await createCustomer(auth, { name: "Late Payer" });
    await createCustomer(auth, { name: "Brand New" });

    await recordTransaction(auth, good._id, "CREDIT", 100);
    const late = await recordTransaction(auth, bad._id, "CREDIT", 900);
    await moveDue(late.body.data._id, -30);

    const response = await api().get("/api/risk").set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.map((i: { customer: { name: string } }) => i.customer.name)).toEqual([
      "Late Payer",
      "Brand New",
      "Good Payer",
    ]);
    expect(response.body.summary).toEqual({ high: 1, medium: 0, new: 1, low: 1 });

    const stored = await Customer.findById(bad._id).lean();
    expect(stored!.risk).toMatchObject({ band: "high", score: 20, suggestedLimit: 0 });

    // The customer list carries the stored risk for badges.
    const list = await api().get("/api/customers").set(auth);
    const row = list.body.data.find((c: { name: string }) => c.name === "Late Payer");
    expect(row.risk.band).toBe("high");
  });

  it("returns 503 when the AI service is down (test env points nowhere)", async () => {
    const { auth } = await registerUser();
    await createCustomer(auth);

    const response = await api().get("/api/risk").set(auth);

    expect(response.status).toBe(503);
    expect(response.body.code).toBe("AI_UNAVAILABLE");
  });

  it("is private to each shop", async () => {
    stubScoring(() => ({ score: 50, band: "medium", suggested_limit: 1000 }));
    const owner = await registerUser();
    const stranger = await registerUser();
    const customer = await createCustomer(owner.auth);

    expect((await api().get(`/api/customers/${customer._id}/risk`).set(stranger.auth)).status).toBe(404);
    expect((await api().get("/api/risk").set(stranger.auth)).body.data).toEqual([]);
  });
});
