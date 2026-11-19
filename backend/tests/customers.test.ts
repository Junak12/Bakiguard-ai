
import { api, createCustomer, recordTransaction, registerUser } from "./helpers.js";

describe("customers", () => {
  it("normalizes Bangladeshi phone numbers to 01XXXXXXXXX", async () => {
    const { auth } = await registerUser();

    for (const [input, expected] of [
      ["+880 1712-345678", "01712345678"],
      ["8801812345678", "01812345678"],
      ["01912 345 678", "01912345678"],
    ]) {
      const customer = await createCustomer(auth, { phone: input });
      expect(customer.phone).toBe(expected);
    }
  });

  it("rejects invalid phone numbers", async () => {
    const { auth } = await registerUser();

    const response = await api()
      .post("/api/customers")
      .set(auth)
      .send({ name: "Karim", phone: "12345" });

    expect(response.status).toBe(400);
    expect(response.body.errors.phone).toBeDefined();
  });

  it("rejects a duplicate phone (even in a different format) with 409", async () => {
    const { auth } = await registerUser();
    await createCustomer(auth, { phone: "01712345678" });

    const response = await api()
      .post("/api/customers")
      .set(auth)
      .send({ name: "Someone else", phone: "+8801712345678" });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("DUPLICATE_PHONE");
  });

  it("returns 404 for a missing customer and 400 for a malformed id", async () => {
    const { auth } = await registerUser();

    expect(
      (await api().get("/api/customers/64b7f0000000000000000000").set(auth)).status
    ).toBe(404);
    expect((await api().get("/api/customers/not-an-id").set(auth)).status).toBe(400);
  });

  it("isolates shops: one owner cannot read another owner's customer", async () => {
    const owner = await registerUser();
    const stranger = await registerUser();
    const customer = await createCustomer(owner.auth);

    const response = await api().get(`/api/customers/${customer._id}`).set(stranger.auth);

    expect(response.status).toBe(404);
  });

  it("ignores attempts to set totalDue directly", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);

    const response = await api()
      .patch(`/api/customers/${customer._id}`)
      .set(auth)
      .send({ name: "New Name", totalDue: 999999 });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("New Name");
    expect(response.body.data.totalDue).toBe(0);
  });

  it("searches by name or phone", async () => {
    const { auth } = await registerUser();
    await createCustomer(auth, { name: "Abdul Karim", phone: "01711111111" });
    await createCustomer(auth, { name: "Jamal", phone: "01822222222" });

    const byName = await api().get("/api/customers?search=karim").set(auth);
    expect(byName.body.data).toHaveLength(1);

    const byPhone = await api().get("/api/customers?search=0182").set(auth);
    expect(byPhone.body.data[0].name).toBe("Jamal");
  });

  it("refuses to remove a customer who still owes money", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth);
    await recordTransaction(auth, customer._id, "CREDIT", 500);

    const response = await api().delete(`/api/customers/${customer._id}`).set(auth);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("CUSTOMER_HAS_DUE");
  });

  it("archives a settled customer, keeps history, and frees the phone number", async () => {
    const { auth } = await registerUser();
    const customer = await createCustomer(auth, { phone: "01755555555" });
    await recordTransaction(auth, customer._id, "CREDIT", 500);
    await recordTransaction(auth, customer._id, "PAYMENT", 500);

    const removed = await api().delete(`/api/customers/${customer._id}`).set(auth);
    expect(removed.status).toBe(200);

    expect((await api().get(`/api/customers/${customer._id}`).set(auth)).status).toBe(404);
    expect((await api().get("/api/customers").set(auth)).body.data).toHaveLength(0);

    // Ledger history is preserved.
    const history = await api().get("/api/transactions").set(auth);
    expect(history.body.pagination.total).toBe(2);

    // The phone number can be used for a new customer.
    const again = await createCustomer(auth, { phone: "01755555555" });
    expect(again.phone).toBe("01755555555");
  });
});
