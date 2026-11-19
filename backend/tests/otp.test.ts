import { Otp } from "../src/model/Otp.js";
import { MAX_VERIFY_ATTEMPTS } from "../src/services/otp.service.js";
import { consoleSmsProvider } from "../src/services/sms/sms.service.js";
import { api } from "./helpers.js";

function lastCodeSentTo(phone: string) {
  const sms = [...consoleSmsProvider.outbox].reverse().find((m) => m.to === phone);
  expect(sms).toBeDefined();
  return sms!.message.match(/\((\d{6})\)/)![1];
}

/** Lets a test request another code without waiting out the cooldown. */
async function skipCooldown(phone: string) {
  await Otp.updateOne({ phone }, { $set: { lastSentAt: new Date(Date.now() - 61_000) } });
}

describe("phone + OTP login", () => {
  it("signs up a new shop owner in two steps", async () => {
    const request = await api().post("/api/auth/otp/request").send({ phone: "+880 1711-000001" });

    expect(request.status).toBe(200);
    expect(request.body.data).toMatchObject({ isNewUser: true, resendAfterSeconds: 60 });

    const sms = consoleSmsProvider.outbox.at(-1)!;
    expect(sms.to).toBe("01711000001");
    expect(sms.message).toContain("BakiGuard কোড");

    const verify = await api().post("/api/auth/otp/verify").send({
      phone: "01711000001",
      code: lastCodeSentTo("01711000001"),
      name: "Rahim Uddin",
      shopName: "Rahim Store",
    });

    expect(verify.status).toBe(201);
    expect(verify.body.data.isNewUser).toBe(true);
    expect(verify.body.data.user).toMatchObject({
      phone: "01711000001",
      shopName: "Rahim Store",
      language: "bn",
      email: null,
    });
    expect(verify.headers["set-cookie"]?.toString()).toContain("bg_refresh=");

    const me = await api()
      .get("/api/auth/me")
      .set({ Authorization: `Bearer ${verify.body.data.accessToken}` });
    expect(me.body.data.name).toBe("Rahim Uddin");
  });

  it("logs an existing owner back in, and reports isNewUser=false", async () => {
    const phone = "01711000002";
    await api().post("/api/auth/otp/request").send({ phone });
    await api()
      .post("/api/auth/otp/verify")
      .send({ phone, code: lastCodeSentTo(phone), name: "Karim" });

    await skipCooldown(phone);
    const again = await api().post("/api/auth/otp/request").send({ phone });
    expect(again.body.data.isNewUser).toBe(false);

    const login = await api()
      .post("/api/auth/otp/verify")
      .send({ phone, code: lastCodeSentTo(phone) });

    expect(login.status).toBe(200);
    expect(login.body.data.isNewUser).toBe(false);
    expect(login.body.data.user.name).toBe("Karim");
  });

  it("accepts a code typed with Bangla digits", async () => {
    const phone = "01711000003";
    await api().post("/api/auth/otp/request").send({ phone: "০১৭১১০০০০০৩" });

    const bangla = lastCodeSentTo(phone).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

    const verify = await api()
      .post("/api/auth/otp/verify")
      .send({ phone, code: bangla, name: "Jamal" });

    expect(verify.status).toBe(201);
  });

  it("asks for a name before consuming the code for a new number", async () => {
    const phone = "01711000004";
    await api().post("/api/auth/otp/request").send({ phone });
    const code = lastCodeSentTo(phone);

    const withoutName = await api().post("/api/auth/otp/verify").send({ phone, code });
    expect(withoutName.status).toBe(400);
    expect(withoutName.body.code).toBe("NAME_REQUIRED");

    // The same code still works once the name is supplied.
    const withName = await api()
      .post("/api/auth/otp/verify")
      .send({ phone, code, name: "Salma" });
    expect(withName.status).toBe(201);
  });

  it("codes are single-use", async () => {
    const phone = "01711000005";
    await api().post("/api/auth/otp/request").send({ phone });
    const code = lastCodeSentTo(phone);

    await api().post("/api/auth/otp/verify").send({ phone, code, name: "Nadia" });
    const reuse = await api().post("/api/auth/otp/verify").send({ phone, code });

    expect(reuse.status).toBe(400);
    expect(reuse.body.code).toBe("OTP_INVALID");
  });

  it(`locks the code after ${MAX_VERIFY_ATTEMPTS} wrong guesses`, async () => {
    const phone = "01711000006";
    await api().post("/api/auth/otp/request").send({ phone });
    const code = lastCodeSentTo(phone);
    const wrong = code === "000000" ? "111111" : "000000";

    for (let i = 0; i < MAX_VERIFY_ATTEMPTS; i += 1) {
      const response = await api()
        .post("/api/auth/otp/verify")
        .send({ phone, code: wrong, name: "Guesser" });
      expect(response.status).toBe(400);
    }

    const correctButLocked = await api()
      .post("/api/auth/otp/verify")
      .send({ phone, code, name: "Guesser" });
    expect(correctButLocked.status).toBe(400);
  });

  it("enforces a resend cooldown", async () => {
    const phone = "01711000007";
    await api().post("/api/auth/otp/request").send({ phone });

    const tooSoon = await api().post("/api/auth/otp/request").send({ phone });

    expect(tooSoon.status).toBe(429);
    expect(tooSoon.body.code).toBe("OTP_COOLDOWN");
    expect(tooSoon.body.errors.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("limits codes per number per hour", async () => {
    const phone = "01711000008";

    for (let i = 0; i < 5; i += 1) {
      await skipCooldown(phone);
      expect((await api().post("/api/auth/otp/request").send({ phone })).status).toBe(200);
    }

    await skipCooldown(phone);
    const sixth = await api().post("/api/auth/otp/request").send({ phone });
    expect(sixth.status).toBe(429);
    expect(sixth.body.code).toBe("OTP_LIMIT");
  });

  it("rejects non-Bangladeshi numbers", async () => {
    const response = await api().post("/api/auth/otp/request").send({ phone: "+1 555 0100" });
    expect(response.status).toBe(400);
  });
});

describe("profile", () => {
  it("updates language, shop name and default credit days", async () => {
    const phone = "01711000009";
    await api().post("/api/auth/otp/request").send({ phone });
    const verify = await api()
      .post("/api/auth/otp/verify")
      .send({ phone, code: lastCodeSentTo(phone), name: "Owner" });
    const auth = { Authorization: `Bearer ${verify.body.data.accessToken}` };

    const update = await api()
      .patch("/api/auth/me")
      .set(auth)
      .send({ language: "en", shopName: "Owner Traders", defaultCreditDays: 15 });

    expect(update.status).toBe(200);
    expect(update.body.data).toMatchObject({
      language: "en",
      shopName: "Owner Traders",
      defaultCreditDays: 15,
    });

    expect(
      (await api().patch("/api/auth/me").set(auth).send({ language: "fr" })).status
    ).toBe(400);
  });
});
