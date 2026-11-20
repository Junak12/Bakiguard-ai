
import { api, createCustomer, recordTransaction, registerUser } from "./helpers.js";

describe("dashboard", () => {
  it("returns shop totals, scoped to the signed-in owner", async () => {
    const { auth } = await registerUser();
    const other = await registerUser();

    const a = await createCustomer(auth);
    const b = await createCustomer(auth);
    await recordTransaction(auth, a._id, "CREDIT", 1000);
    await recordTransaction(auth, b._id, "CREDIT", 500);
    await recordTransaction(auth, a._id, "PAYMENT", 400);

    const otherCustomer = await createCustomer(other.auth);
    await recordTransaction(other.auth, otherCustomer._id, "CREDIT", 9999);

    const response = await api().get("/api/dashboard/stats").set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      totalCustomers: 2,
      totalCredit: 1500,
      totalPayment: 400,
      totalBaki: 1100,
    });
  });

  it("returns zeros for a brand new shop", async () => {
    const { auth } = await registerUser();

    const response = await api().get("/api/dashboard/stats").set(auth);

    expect(response.body.data).toEqual({
      totalCustomers: 0,
      totalCredit: 0,
      totalPayment: 0,
      totalBaki: 0,
    });
  });

  it("AI insights degrade gracefully when the AI service is down", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);
    await recordTransaction(auth, customer._id, "CREDIT", 750);

    const response = await api().get("/api/ai/dashboard-insights").set(auth);

    expect(response.status).toBe(200);
    expect(response.body.data.available).toBe(false);
    expect(response.body.data.insights).toEqual([]);
    expect(response.body.data.summary.total_baki).toBe(750);
  });
});

describe("api basics", () => {
  it("health endpoints respond", async () => {
    expect((await api().get("/api/health")).status).toBe(200);
    expect((await api().get("/api/health/ready")).body.database).toBe("connected");
  });

  it("unknown routes return a JSON 404", async () => {
    const response = await api().get("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("malformed JSON returns 400, not 500", async () => {
    const response = await api()
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("BAD_JSON");
  });
});
