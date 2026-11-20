import { Customer } from "../src/model/Customer.js";
import { Transaction } from "../src/model/Transaction.js";
import { User } from "../src/model/User.js";
import type { GoogleProfile } from "../src/services/google.service.js";
import { api, createCustomer, recordTransaction, registerUser } from "./helpers.js";

// Staff sign in with Google; the verifier is stubbed (see google.test.ts).
const google = vi.hoisted(() => ({ profile: null as GoogleProfile | null }));

vi.mock("../src/services/google.service.js", () => ({
  verifyGoogleIdToken: async () => google.profile!,
}));

const ADMIN = { "X-Admin-Key": "test-admin-key-0123456789" };

let counter = 0;

async function googleUser(email: string, name = "Staff Person") {
  counter += 1;
  google.profile = { googleId: `g-${counter}-${email}`, email, name };
  const response = await api().post("/api/auth/google").send({ credential: "x".repeat(40) });
  return { auth: { Authorization: `Bearer ${response.body.data.accessToken}` }, user: response.body.data.user };
}

async function makePro(auth: Record<string, string>) {
  const me = await api().get("/api/auth/me").set(auth);
  await User.updateOne(
    { _id: me.body.data.id },
    { $set: { plan: "pro", planExpiresAt: new Date(Date.now() + 30 * 864e5) } }
  );
}

/** Owner (Pro) with one active staff member of the given role. */
async function shopWithStaff(role: "staff" | "manager" = "staff") {
  const owner = await registerUser();
  await makePro(owner.auth);
  await api().patch("/api/auth/me").set(owner.auth).send({ shopName: "Rahim Store", paymentInfo: "bKash 017" });

  const email = `staff${++counter}@gmail.com`;
  const invite = await api().post("/api/staff/invites").set(owner.auth).send({ email, role });
  expect(invite.status).toBe(201);

  const staff = await googleUser(email);
  const invites = await api().get("/api/staff/my-invites").set(staff.auth);
  expect(invites.body.data).toHaveLength(1);
  expect(invites.body.data[0]).toMatchObject({ shopName: "Rahim Store", role });

  const accepted = await api().post(`/api/staff/my-invites/${invites.body.data[0].id}/accept`).set(staff.auth);
  expect(accepted.status).toBe(200);

  return { owner, staff, email };
}

describe("staff accounts", () => {
  it("staff work in the owner's khata, with the shop's settings and their own name", async () => {
    const { owner, staff } = await shopWithStaff();

    const me = await api().get("/api/auth/me").set(staff.auth);
    expect(me.body.data).toMatchObject({
      role: "staff",
      name: "Staff Person",
      shopName: "Rahim Store",
      paymentInfo: "bKash 017",
      plan: "pro",
    });

    // Staff adds a customer and gives Baki: it lands in the owner's shop.
    const customer = await createCustomer(staff.auth, { name: "Shared Customer" });
    await recordTransaction(staff.auth, customer._id, "CREDIT", 400);

    const ownerList = await api().get("/api/customers").set(owner.auth);
    expect(ownerList.body.data.map((c: { name: string }) => c.name)).toContain("Shared Customer");

    // ...and records who entered it.
    const history = await api().get(`/api/transactions/customer/${customer._id}`).set(owner.auth);
    expect(history.body.data[0].createdBy.name).toBe("Staff Person");

    const stored = await Transaction.findOne({ customerId: customer._id }).lean();
    expect(String(stored!.createdBy)).toBe(me.body.data.id);
  });

  it("limits what plain staff can do", async () => {
    const { owner, staff } = await shopWithStaff("staff");
    const customer = await createCustomer(owner.auth);

    expect((await api().delete(`/api/customers/${customer._id}`).set(staff.auth)).status).toBe(403);
    expect(
      (await api().patch(`/api/customers/${customer._id}`).set(staff.auth).send({ creditLimit: 9000 })).status
    ).toBe(403);
    expect((await api().get("/api/reports/monthly").set(staff.auth)).status).toBe(403);
    expect((await api().get("/api/billing").set(staff.auth)).status).toBe(403);
    expect((await api().get("/api/staff").set(staff.auth)).status).toBe(403);
    expect((await api().patch("/api/auth/me").set(staff.auth).send({ shopName: "Hacked" })).status).toBe(403);

    // Their own profile is fine.
    const rename = await api().patch("/api/auth/me").set(staff.auth).send({ name: "Renamed", language: "en" });
    expect(rename.status).toBe(200);
    expect(rename.body.data).toMatchObject({ name: "Renamed", shopName: "Rahim Store" });

    // Editing customer details is allowed.
    expect(
      (await api().patch(`/api/customers/${customer._id}`).set(staff.auth).send({ name: "New Name" })).status
    ).toBe(200);
  });

  it("managers can see reports and set limits, but not billing or staff", async () => {
    const { owner, staff: manager } = await shopWithStaff("manager");
    const customer = await createCustomer(owner.auth);

    expect((await api().get("/api/reports/monthly").set(manager.auth)).status).toBe(200);
    expect(
      (await api().patch(`/api/customers/${customer._id}`).set(manager.auth).send({ creditLimit: 9000 })).status
    ).toBe(200);
    expect((await api().get("/api/billing").set(manager.auth)).status).toBe(403);
    expect((await api().post("/api/staff/invites").set(manager.auth).send({ email: "x@gmail.com", role: "staff" })).status).toBe(403);
  });

  it("removing a member cuts access on their very next request", async () => {
    const { owner, staff } = await shopWithStaff();
    await createCustomer(owner.auth, { name: "Owner's Customer" });

    expect((await api().get("/api/customers").set(staff.auth)).body.data).toHaveLength(1);

    const members = await api().get("/api/staff").set(owner.auth);
    expect(members.body.data[0]).toMatchObject({ status: "active", name: "Staff Person" });

    await api().delete(`/api/staff/${members.body.data[0].id}`).set(owner.auth);

    // Same (unexpired) token, now back in their own empty shop.
    expect((await api().get("/api/customers").set(staff.auth)).body.data).toHaveLength(0);
    expect((await api().get("/api/auth/me").set(staff.auth)).body.data.role).toBe("owner");
  });

  it("only a Google account with the invited email can accept", async () => {
    const owner = await registerUser();
    await makePro(owner.auth);
    await api().post("/api/staff/invites").set(owner.auth).send({ email: "victim@gmail.com", role: "manager" });

    // Someone registers an email+password account with that address (unverified).
    const impostor = await registerUser({ email: "victim@gmail.com" });
    expect((await api().get("/api/staff/my-invites").set(impostor.auth)).body.data).toEqual([]);

    const invite = (await api().get("/api/staff").set(owner.auth)).body.data[0];
    const attempt = await api().post(`/api/staff/my-invites/${invite.id}/accept`).set(impostor.auth);
    expect(attempt.status).toBe(403);

    // A different Google account can't take it either.
    const other = await googleUser("other@gmail.com");
    expect((await api().post(`/api/staff/my-invites/${invite.id}/accept`).set(other.auth)).status).toBe(404);
  });

  it("won't let someone with their own customers join another shop", async () => {
    const owner = await registerUser();
    await makePro(owner.auth);
    await api().post("/api/staff/invites").set(owner.auth).send({ email: "busy@gmail.com", role: "staff" });

    const busy = await googleUser("busy@gmail.com");
    await createCustomer(busy.auth);

    const invite = (await api().get("/api/staff/my-invites").set(busy.auth)).body.data[0];
    const attempt = await api().post(`/api/staff/my-invites/${invite.id}/accept`).set(busy.auth);

    expect(attempt.status).toBe(409);
    expect(attempt.body.code).toBe("HAS_OWN_SHOP");
  });

  it("staff can leave a shop", async () => {
    const { staff } = await shopWithStaff();

    expect((await api().post("/api/staff/leave").set(staff.auth)).status).toBe(200);
    expect((await api().get("/api/auth/me").set(staff.auth)).body.data.role).toBe("owner");
  });
});

describe("plan limits", () => {
  it("Free plan: no staff, no export, 50 customers", async () => {
    const { auth, credentials } = await registerUser();

    const invite = await api().post("/api/staff/invites").set(auth).send({ email: "s@gmail.com", role: "staff" });
    expect(invite.status).toBe(402);
    expect(invite.body.code).toBe("PLAN_LIMIT_STAFF");

    const owner = await User.findOne({ email: credentials.email }).lean();
    await Customer.insertMany(
      Array.from({ length: 50 }, (_, i) => ({
        userId: owner!._id,
        name: `Customer ${i}`,
        phone: `0171${String(1000000 + i)}`,
      }))
    );

    const fiftyFirst = await api().post("/api/customers").set(auth).send({ name: "One More", phone: "01899999999" });
    expect(fiftyFirst.status).toBe(402);
    expect(fiftyFirst.body.code).toBe("PLAN_LIMIT_CUSTOMERS");

    // Pro removes the customer limit.
    await makePro(auth);
    expect(
      (await api().post("/api/customers").set(auth).send({ name: "One More", phone: "01899999999" })).status
    ).toBe(201);
  });

  it("Pro lapses back to Free when it expires", async () => {
    const { auth, credentials } = await registerUser();
    await User.updateOne(
      { email: credentials.email },
      { $set: { plan: "pro", planExpiresAt: new Date(Date.now() - 1000) } }
    );

    expect((await api().get("/api/billing").set(auth)).body.data.plan).toBe("free");
  });
});

describe("billing", () => {
  it("owner reports a bKash payment, admin approves, Pro starts for 30 days", async () => {
    const { auth } = await registerUser();

    const billing = await api().get("/api/billing").set(auth);
    expect(billing.body.data).toMatchObject({
      plan: "free",
      payTo: { method: "bkash", number: "01700000000", amount: 199 },
      usage: { customers: 0, staff: 0 },
    });
    expect(billing.body.data.payTo.reference).toMatch(/^BG[0-9A-F]{6}$/);

    const pay = await api()
      .post("/api/billing/payments")
      .set(auth)
      .send({ trxId: "9ab2cd3ef4", senderNumber: "01811111111" });
    expect(pay.status).toBe(201);
    expect(pay.body.data).toMatchObject({ trxId: "9AB2CD3EF4", status: "pending", amount: 199 });

    // One pending payment at a time.
    expect(
      (await api().post("/api/billing/payments").set(auth).send({ trxId: "ZZZ1112223", senderNumber: "01811111111" }))
        .status
    ).toBe(409);

    // Admin endpoints are invisible without the key.
    expect((await api().get("/api/admin/payments")).status).toBe(404);
    expect((await api().get("/api/admin/payments").set({ "X-Admin-Key": "wrong" })).status).toBe(404);

    const pending = await api().get("/api/admin/payments").set(ADMIN);
    expect(pending.body.data).toHaveLength(1);

    const approve = await api().post(`/api/admin/payments/${pending.body.data[0]._id}/approve`).set(ADMIN);
    expect(approve.status).toBe(200);

    const after = await api().get("/api/billing").set(auth);
    expect(after.body.data.plan).toBe("pro");
    const days = (new Date(after.body.data.expiresAt).getTime() - Date.now()) / 864e5;
    expect(Math.round(days)).toBe(30);

    // Can't approve twice; can't reuse the transaction id.
    expect((await api().post(`/api/admin/payments/${pending.body.data[0]._id}/approve`).set(ADMIN)).status).toBe(404);
    const other = await registerUser();
    const reuse = await api()
      .post("/api/billing/payments")
      .set(other.auth)
      .send({ trxId: "9AB2CD3EF4", senderNumber: "01822222222" });
    expect(reuse.status).toBe(409);
    expect(reuse.body.code).toBe("TRX_ID_USED");
  });

  it("renewing early adds 30 days on top of the current expiry", async () => {
    const { auth } = await registerUser();

    for (const trxId of ["AAAA111111", "BBBB222222"]) {
      await api().post("/api/billing/payments").set(auth).send({ trxId, senderNumber: "01811111111" });
      const [pending] = (await api().get("/api/admin/payments").set(ADMIN)).body.data;
      await api().post(`/api/admin/payments/${pending._id}/approve`).set(ADMIN);
    }

    const billing = await api().get("/api/billing").set(auth);
    const days = (new Date(billing.body.data.expiresAt).getTime() - Date.now()) / 864e5;
    expect(Math.round(days)).toBe(60);
  });

  it("rejecting keeps the shop on Free", async () => {
    const { auth } = await registerUser();
    await api().post("/api/billing/payments").set(auth).send({ trxId: "CCCC333333", senderNumber: "01811111111" });
    const [pending] = (await api().get("/api/admin/payments").set(ADMIN)).body.data;

    const reject = await api()
      .post(`/api/admin/payments/${pending._id}/reject`)
      .set(ADMIN)
      .send({ note: "Not found in bKash statement" });
    expect(reject.status).toBe(200);

    const billing = await api().get("/api/billing").set(auth);
    expect(billing.body.data.plan).toBe("free");
    expect(billing.body.data.payments[0]).toMatchObject({ status: "rejected", note: "Not found in bKash statement" });
  });

  it("validates the transaction id and sender number", async () => {
    const { auth } = await registerUser();

    expect(
      (await api().post("/api/billing/payments").set(auth).send({ trxId: "short", senderNumber: "01811111111" })).status
    ).toBe(400);
    expect(
      (await api().post("/api/billing/payments").set(auth).send({ trxId: "9AB2CD3EF4", senderNumber: "123" })).status
    ).toBe(400);
  });
});
