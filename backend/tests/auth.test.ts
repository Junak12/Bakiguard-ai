
import { api, registerUser } from "./helpers.js";

function refreshCookieFrom(setCookie: string[]) {
  const cookie = setCookie.find((value) => value.startsWith("bg_refresh="));
  expect(cookie).toBeDefined();
  return cookie!.split(";")[0];
}

describe("auth", () => {
  it("registers, returns an access token and sets an httpOnly refresh cookie", async () => {
    const response = await api().post("/api/auth/register").send({
      name: "Rahim Store",
      email: "Rahim@Example.com",
      password: "strong-password-1",
    });

    expect(response.status).toBe(201);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user).toMatchObject({ email: "rahim@example.com" });
    expect(response.body.data.user.password).toBeUndefined();

    const cookie = (response.headers["set-cookie"] as unknown as string[]).join(";");
    expect(cookie).toContain("bg_refresh=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/api/auth");
  });

  it("rejects a duplicate email with 409", async () => {
    const { credentials } = await registerUser();

    const response = await api().post("/api/auth/register").send(credentials);

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("EMAIL_TAKEN");
  });

  it("rejects weak passwords", async () => {
    const response = await api().post("/api/auth/register").send({
      name: "Rahim",
      email: "weak@example.com",
      password: "123",
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.password).toBeDefined();
  });

  it("returns 401 (not 500) for an unknown email", async () => {
    const response = await api().post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "whatever-123",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("returns the same 401 for a wrong password", async () => {
    const { credentials } = await registerUser();

    const response = await api().post("/api/auth/login").send({
      email: credentials.email,
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  it("logs in with correct credentials", async () => {
    const { credentials } = await registerUser();

    const response = await api().post("/api/auth/login").send({
      email: credentials.email,
      password: credentials.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
  });

  it("protects routes and accepts a valid access token", async () => {
    const { auth, credentials } = await registerUser();

    expect((await api().get("/api/auth/me")).status).toBe(401);
    expect(
      (await api().get("/api/auth/me").set({ Authorization: "Bearer garbage" })).body.code
    ).toBe("TOKEN_EXPIRED");

    const me = await api().get("/api/auth/me").set(auth);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(credentials.email);
  });

  it("rotates the refresh token: the old one stops working", async () => {
    const { cookie } = await registerUser();
    const original = refreshCookieFrom(cookie);

    const first = await api().post("/api/auth/refresh").set("Cookie", original);
    expect(first.status).toBe(200);
    expect(first.body.data.accessToken).toEqual(expect.any(String));
    const rotated = refreshCookieFrom(first.headers["set-cookie"] as unknown as string[]);
    expect(rotated).not.toBe(original);

    const reused = await api().post("/api/auth/refresh").set("Cookie", original);
    expect(reused.status).toBe(401);
    expect(reused.body.code).toBe("SESSION_EXPIRED");

    const second = await api().post("/api/auth/refresh").set("Cookie", rotated);
    expect(second.status).toBe(200);
  });

  it("logout revokes the session", async () => {
    const { cookie } = await registerUser();
    const refreshCookie = refreshCookieFrom(cookie);

    const logout = await api().post("/api/auth/logout").set("Cookie", refreshCookie);
    expect(logout.status).toBe(200);

    const refresh = await api().post("/api/auth/refresh").set("Cookie", refreshCookie);
    expect(refresh.status).toBe(401);
  });

  it("refresh without a cookie is 401", async () => {
    const response = await api().post("/api/auth/refresh");
    expect(response.status).toBe(401);
  });
});

describe("registration with a shop name", () => {
  it("stores the optional shop name", async () => {
    const response = await api().post("/api/auth/register").send({
      name: "Rahim",
      email: "shop@example.com",
      password: "strong-password-1",
      shopName: "Rahim Store",
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({ shopName: "Rahim Store", role: "owner" });
  });

  it("no longer offers Google sign-in", async () => {
    expect((await api().post("/api/auth/google").send({ credential: "x".repeat(40) })).status).toBe(404);
  });
});
