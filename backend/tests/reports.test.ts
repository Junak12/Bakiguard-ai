import mongoose from "mongoose";

import { Transaction } from "../src/model/Transaction.js";
import { User } from "../src/model/User.js";
import { monthRange } from "../src/services/report.service.js";
import { api, createCustomer, recordTransaction, registerUser } from "./helpers.js";

/** Moves a transaction to a given instant (raw driver: Mongoose keeps createdAt immutable). */
async function at(id: string, iso: string) {
  await Transaction.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { createdAt: new Date(iso) } }
  );
}

describe("month boundaries (Dhaka time)", () => {
  it("starts at local midnight, i.e. 18:00 UTC the day before", () => {
    const { start, end, days } = monthRange("2026-11");

    expect(start.toISOString()).toBe("2026-10-31T18:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-30T18:00:00.000Z");
    expect(days).toBe(30);
  });
});

describe("monthly report", () => {
  it("rebuilds opening/closing Baki and totals from the ledger", async () => {
    const { auth } = await registerUser();
    const karim = await createCustomer(auth, { name: "Karim" });
    const jamal = await createCustomer(auth, { name: "Jamal" });

    // October (before the month): Karim takes 1000, pays 300 -> opening 700.
    await at((await recordTransaction(auth, karim._id, "CREDIT", 1000)).body.data._id, "2026-10-05T06:00:00Z");
    await at((await recordTransaction(auth, karim._id, "PAYMENT", 300)).body.data._id, "2026-10-20T06:00:00Z");

    // 31 Oct 19:00 UTC = 1 Nov 01:00 in Dhaka -> counts in November.
    await at((await recordTransaction(auth, jamal._id, "CREDIT", 500)).body.data._id, "2026-10-31T19:00:00Z");
    // November.
    await at((await recordTransaction(auth, karim._id, "PAYMENT", 200)).body.data._id, "2026-11-10T06:00:00Z");
    await at((await recordTransaction(auth, jamal._id, "CREDIT", 250)).body.data._id, "2026-11-15T06:00:00Z");
    // December: must not count.
    await at((await recordTransaction(auth, jamal._id, "PAYMENT", 100)).body.data._id, "2026-12-02T06:00:00Z");

    const response = await api().get("/api/reports/monthly?month=2026-11").set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      month: "2026-11",
      openingBaki: 700,
      creditGiven: 750,
      creditCount: 2,
      collected: 200,
      paymentCount: 1,
      netChange: 550,
      closingBaki: 1250,
      collectionRate: 14, // 200 / (700 + 750)
      customersOwing: 2,
    });

    expect(response.body.data.topDebtors.map((d: { name: string; balance: number }) => [d.name, d.balance])).toEqual([
      ["Jamal", 750],
      ["Karim", 500],
    ]);

    const daily = response.body.data.daily;
    expect(daily).toHaveLength(30);
    expect(daily[0]).toEqual({ date: "2026-11-01", credit: 500, payment: 0 });
    expect(daily.find((d: { date: string }) => d.date === "2026-11-10").payment).toBe(200);
  });

  it("defaults to the current month and validates the month", async () => {
    const { auth } = await registerUser();

    const current = await api().get("/api/reports/monthly").set(auth);
    expect(current.status).toBe(200);
    expect(current.body.data.month).toMatch(/^\d{4}-\d{2}$/);

    expect((await api().get("/api/reports/monthly?month=2026-13").set(auth)).status).toBe(400);
  });

  it("only includes the signed-in shop's data", async () => {
    const owner = await registerUser();
    const other = await registerUser();
    const customer = await createCustomer(other.auth);
    await recordTransaction(other.auth, customer._id, "CREDIT", 9999);

    const response = await api().get("/api/reports/monthly").set(owner.auth);
    expect(response.body.data.creditGiven).toBe(0);
  });
});

describe("CSV export", () => {
  it("downloads the month's transactions with a BOM, safe against formula injection", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth, { name: "=HYPERLINK(\"x\")" });
    const credit = await api()
      .post("/api/transactions")
      .set(auth)
      .send({ customerId: customer._id, type: "CREDIT", amount: 450, description: "চাল, \"ডাল\"" });
    await at(credit.body.data._id, "2026-11-03T04:00:00Z");

    // Export is a Pro feature.
    const free = await api().get("/api/reports/monthly/export?month=2026-11").set(auth);
    expect(free.status).toBe(402);
    expect(free.body.code).toBe("PLAN_REQUIRED");

    await User.updateOne({}, { $set: { plan: "pro", planExpiresAt: new Date(Date.now() + 864e5) } });

    const response = await api().get("/api/reports/monthly/export?month=2026-11").set(auth);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.headers["content-disposition"]).toContain("bakiguard-2026-11.csv");

    const body = response.text;
    expect(body.charCodeAt(0)).toBe(0xfeff);

    const lines = body.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"2026-11-03 10:00"');
    expect(lines[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(lines[1]).toContain('"চাল, ""ডাল"""');
    expect(lines[1]).toContain('"450"');
  });
});
