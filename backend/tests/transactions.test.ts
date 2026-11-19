
import { api, createCustomer, recordTransaction, registerUser } from "./helpers.js";

async function customerDue(auth: Record<string, string>, id: string) {
  const response = await api().get(`/api/customers/${id}`).set(auth);
  return response.body.data.totalDue as number;
}

describe("transactions", () => {
  it("credit increases and payment decreases the customer's Baki", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    expect((await recordTransaction(auth, customer._id, "CREDIT", 1200)).status).toBe(201);
    expect(await customerDue(auth, customer._id)).toBe(1200);

    expect((await recordTransaction(auth, customer._id, "PAYMENT", 700)).status).toBe(201);
    expect(await customerDue(auth, customer._id)).toBe(500);
  });

  it("rejects a payment larger than the Baki and leaves the balance unchanged", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);
    await recordTransaction(auth, customer._id, "CREDIT", 300);

    const response = await recordTransaction(auth, customer._id, "PAYMENT", 301);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("PAYMENT_EXCEEDS_DUE");
    expect(await customerDue(auth, customer._id)).toBe(300);
    expect((await api().get("/api/transactions").set(auth)).body.pagination.total).toBe(1);
  });

  it("never lets concurrent payments push a balance below zero", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);
    await recordTransaction(auth, customer._id, "CREDIT", 1000);

    // Five simultaneous ৳400 payments against ৳1000 Baki: at most two can succeed.
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        recordTransaction(auth, customer._id, "PAYMENT", 400)
      )
    );

    const succeeded = results.filter((result) => result.status === 201).length;

    expect(succeeded).toBe(2);
    expect(await customerDue(auth, customer._id)).toBe(200);
  });

  it("rejects fractional, zero and negative amounts", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    for (const amount of [10.5, 0, -100]) {
      const response = await recordTransaction(auth, customer._id, "CREDIT", amount);
      expect(response.status).toBe(400);
    }
  });

  it("cannot record a transaction against another shop's customer", async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const customer = await createCustomer(owner.auth);

    const response = await recordTransaction(stranger.auth, customer._id, "CREDIT", 100);

    expect(response.status).toBe(404);
    expect(await customerDue(owner.auth, customer._id)).toBe(0);
  });

  it("paginates customer history with a summary", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    for (let i = 0; i < 3; i += 1) {
      await recordTransaction(auth, customer._id, "CREDIT", 100);
    }
    await recordTransaction(auth, customer._id, "PAYMENT", 50);

    const response = await api()
      .get(`/api/transactions/customer/${customer._id}?page=1&limit=2`)
      .set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].type).toBe("PAYMENT");
    expect(response.body.pagination).toEqual({ page: 1, limit: 2, total: 4, totalPages: 2 });
    expect(response.body.summary).toEqual({
      totalCredit: 300,
      totalPayment: 50,
      creditCount: 3,
      paymentCount: 1,
    });
  });

  it("validates pagination parameters", async () => {
    const { auth } = await registerUser();

    expect((await api().get("/api/transactions?limit=1000").set(auth)).status).toBe(400);
    expect((await api().get("/api/transactions?page=0").set(auth)).status).toBe(400);
  });
});

describe("transaction filters", () => {
  it("filters by type, customer name/phone and date range across all pages", async () => {
    const { auth } = await registerUser();
    const karim = await createCustomer(auth, { name: "Karim Mia", phone: "01710000001" });
    const jamal = await createCustomer(auth, { name: "Jamal", phone: "01810000002" });

    for (let i = 0; i < 12; i += 1) {
      await recordTransaction(auth, jamal._id, "CREDIT", 10);
    }
    await recordTransaction(auth, karim._id, "CREDIT", 500);
    await recordTransaction(auth, karim._id, "PAYMENT", 200);

    const byName = await api().get("/api/transactions?search=karim&limit=5").set(auth);
    expect(byName.body.pagination.total).toBe(2);

    const byPhone = await api().get("/api/transactions?search=01710").set(auth);
    expect(byPhone.body.pagination.total).toBe(2);

    const payments = await api().get("/api/transactions?type=PAYMENT").set(auth);
    expect(payments.body.pagination.total).toBe(1);
    expect(payments.body.data[0].amount).toBe(200);

    const combined = await api().get("/api/transactions?search=jamal&type=PAYMENT").set(auth);
    expect(combined.body.pagination.total).toBe(0);

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const future = await api().get(`/api/transactions?from=${tomorrow}`).set(auth);
    expect(future.body.pagination.total).toBe(0);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recent = await api().get(`/api/transactions?from=${yesterday}&to=${tomorrow}`).set(auth);
    expect(recent.body.pagination.total).toBe(14);

    expect((await api().get("/api/transactions?type=REFUND").set(auth)).status).toBe(400);
  });
});
