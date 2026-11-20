import { Customer } from "../src/model/Customer.js";
import { Transaction } from "../src/model/Transaction.js";
import { api, createCustomer, recordTransaction, registerUser } from "./helpers.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Moves a customer's credits (and nextDueAt) so they fall due `days` from now (negative = late). */
async function setDue(customerId: string, days: number) {
  const due = new Date(Date.now() + days * DAY_MS);
  await Transaction.updateMany({ customerId, type: "CREDIT" }, { $set: { dueDate: due } });
  await Customer.updateOne({ _id: customerId }, { $set: { nextDueAt: due } });
}

async function credit(auth: Record<string, string>, name: string, amount: number, dueInDays: number) {
  const customer = await createCustomer(auth, { name });
  await recordTransaction(auth, customer._id, "CREDIT", amount);
  await setDue(customer._id, dueInDays);
  return customer;
}

describe("daily collection list", () => {
  it("ranks overdue by amount x lateness, then due-soon by date, and skips the rest", async () => {
    const { auth } = await registerUser();

    await credit(auth, "Small but very late", 1000, -60);
    await credit(auth, "Big but just late", 1500, -2);
    await credit(auth, "Due in 2 days", 500, 2);
    await credit(auth, "Due tomorrow", 300, 1);
    await credit(auth, "Due next month", 900, 30);
    await createCustomer(auth, { name: "Owes nothing" });

    const response = await api().get("/api/collections").set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.map((item: { customer: { name: string } }) => item.customer.name)).toEqual([
      "Small but very late", // 1000 * (1 + 60/30) = 3000
      "Big but just late", // 1500 * (1 + 2/30) = 1600
      "Due tomorrow",
      "Due in 2 days",
    ]);

    const [first] = response.body.data;
    expect(first).toMatchObject({ status: "overdue", overdueAmount: 1000, remindedRecently: false });
    expect(first.daysLate).toBeGreaterThanOrEqual(59);
    expect(first.customer.statementToken).toMatch(/^[A-Za-z0-9_-]{32}$/);

    expect(response.body.summary).toMatchObject({
      count: 4,
      overdueCount: 2,
      dueSoonCount: 2,
      totalOverdue: 2500,
      totalToCollect: 3300,
    });

    const wider = await api().get("/api/collections?days=30").set(auth);
    expect(wider.body.summary.count).toBe(5);
  });

  it("moves customers reminded today to the bottom and logs the reminder", async () => {
    const { auth } = await registerUser();
    const a = await credit(auth, "Alpha", 2000, -10);
    await credit(auth, "Bravo", 500, -10);

    const remind = await api()
      .post(`/api/customers/${a._id}/reminders`)
      .set(auth)
      .send({ channel: "whatsapp" });

    expect(remind.status).toBe(201);
    expect(remind.body.data).toMatchObject({ channel: "whatsapp", amount: 2000 });

    const list = await api().get("/api/collections").set(auth);
    expect(list.body.data.map((item: { customer: { name: string } }) => item.customer.name)).toEqual(["Bravo", "Alpha"]);
    expect(list.body.data[1].remindedRecently).toBe(true);
    expect(list.body.summary.remindedRecently).toBe(1);

    const history = await api().get(`/api/customers/${a._id}/reminders`).set(auth);
    expect(history.body.data).toHaveLength(1);

    const bad = await api().post(`/api/customers/${a._id}/reminders`).set(auth).send({ channel: "pigeon" });
    expect(bad.status).toBe(400);
  });

  it("is private to each shop", async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const customer = await credit(owner.auth, "Owner's customer", 700, -5);

    expect((await api().get("/api/collections").set(stranger.auth)).body.data).toHaveLength(0);
    expect(
      (await api().post(`/api/customers/${customer._id}/reminders`).set(stranger.auth).send({ channel: "sms" }))
        .status
    ).toBe(404);
  });
});

describe("public statement link", () => {
  it("shows the customer's balance and history without login, and nothing else", async () => {
    const { auth } = await registerUser();
    await api()
      .patch("/api/auth/me")
      .set(auth)
      .send({ shopName: "Rahim Store", paymentInfo: "bKash: 01712345678" });

    const customer = await credit(auth, "Karim", 1200, -15);
    await recordTransaction(auth, customer._id, "PAYMENT", 200);
    await credit(auth, "Someone else", 999, 5);

    const detail = await api().get(`/api/customers/${customer._id}`).set(auth);
    const token = detail.body.data.statementToken as string;

    const response = await api().get(`/api/public/statements/${token}`);

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers["x-robots-tag"]).toContain("noindex");
    expect(response.body.data).toMatchObject({
      shop: { name: "Rahim Store", paymentInfo: "bKash: 01712345678" },
      customer: { name: "Karim", totalDue: 1000, overdueAmount: 1000 },
    });
    expect(response.body.data.transactions).toHaveLength(2);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain("Someone else");
    expect(body).not.toContain(customer._id);
    expect(body).not.toContain("_id");
    expect(body).not.toContain("userId");
  });

  it("rotating the link revokes the old one", async () => {
    const { auth } = await registerUser();
    const customer = await credit(auth, "Karim", 100, 3);
    const oldToken = (await api().get(`/api/customers/${customer._id}`).set(auth)).body.data.statementToken;

    const rotate = await api().post(`/api/customers/${customer._id}/statement-link`).set(auth);
    const newToken = rotate.body.data.statementToken;

    expect(newToken).not.toBe(oldToken);
    expect((await api().get(`/api/public/statements/${oldToken}`)).status).toBe(404);
    expect((await api().get(`/api/public/statements/${newToken}`)).status).toBe(200);
  });

  it("rejects malformed tokens and archived customers", async () => {
    expect((await api().get("/api/public/statements/short")).status).toBe(400);
    expect((await api().get(`/api/public/statements/${"x".repeat(32)}`)).status).toBe(404);

    const { auth } = await registerUser();
    const customer = await createCustomer(auth);
    const token = (await api().get(`/api/customers/${customer._id}`).set(auth)).body.data.statementToken;
    await api().delete(`/api/customers/${customer._id}`).set(auth);

    expect((await api().get(`/api/public/statements/${token}`)).status).toBe(404);
  });
});
