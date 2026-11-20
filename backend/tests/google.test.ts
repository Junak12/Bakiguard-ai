import { User } from "../src/model/User.js";
import type { GoogleProfile } from "../src/services/google.service.js";
import { AppError } from "../src/utils/AppError.js";
import { api, registerUser } from "./helpers.js";

// Real Google tokens can't be minted in tests; the verifier is the trust boundary.
// A plain function (not a spy) so a rejected verification isn't tracked as unhandled.
const google = vi.hoisted(() => ({
  calls: [] as string[],
  impl: null as null | ((token: string) => Promise<GoogleProfile>),
}));

vi.mock("../src/services/google.service.js", () => ({
  verifyGoogleIdToken: (token: string) => {
    google.calls.push(token);
    return google.impl!(token);
  },
}));

const verify = {
  mockReset() {
    google.calls = [];
    google.impl = null;
  },
  mockResolvedValue(profile: GoogleProfile) {
    google.impl = async () => profile;
  },
  rejectWith(error: Error) {
    google.impl = async () => {
      throw error;
    };
  },
};

function googleUser(overrides: Partial<{ googleId: string; email: string; name: string }> = {}) {
  return {
    googleId: "google-sub-1",
    email: "rahim.store@gmail.com",
    name: "Rahim Uddin",
    avatarUrl: "https://lh3.googleusercontent.com/a/photo",
    ...overrides,
  };
}

const CREDENTIAL = "header.payload.signature-from-google-identity-services";

describe("Sign in with Google", () => {
  beforeEach(() => verify.mockReset());

  it("creates an account on first sign-in and sets a session cookie", async () => {
    verify.mockResolvedValue(googleUser());

    const response = await api().post("/api/auth/google").send({ credential: CREDENTIAL });

    expect(response.status).toBe(201);
    expect(response.body.data.isNewUser).toBe(true);
    expect(response.body.data.user).toMatchObject({
      name: "Rahim Uddin",
      email: "rahim.store@gmail.com",
      avatarUrl: "https://lh3.googleusercontent.com/a/photo",
      language: "bn",
    });
    expect(response.headers["set-cookie"]?.toString()).toContain("bg_refresh=");
    expect(google.calls).toEqual([CREDENTIAL]);
  });

  it("signs the same Google account into the same BakiGuard account", async () => {
    verify.mockResolvedValue(googleUser());

    const first = await api().post("/api/auth/google").send({ credential: CREDENTIAL });
    const second = await api().post("/api/auth/google").send({ credential: CREDENTIAL });

    expect(second.status).toBe(200);
    expect(second.body.data.isNewUser).toBe(false);
    expect(second.body.data.user.id).toBe(first.body.data.user.id);
    expect(await User.countDocuments({ googleId: "google-sub-1" })).toBe(1);
  });

  it("links to an existing email account with the same address", async () => {
    const { credentials } = await registerUser({ email: "old.owner@gmail.com" });
    verify.mockResolvedValue(googleUser({ googleId: "google-sub-2", email: credentials.email }));

    const response = await api().post("/api/auth/google").send({ credential: CREDENTIAL });

    expect(response.status).toBe(200);
    expect(response.body.data.isNewUser).toBe(false);
    expect(response.body.data.user.email).toBe("old.owner@gmail.com");
    expect(await User.countDocuments({ email: "old.owner@gmail.com" })).toBe(1);
  });

  it("rejects tokens the verifier rejects", async () => {
    verify.rejectWith(AppError.unauthorized("Google sign-in failed.", "GOOGLE_INVALID"));

    const response = await api().post("/api/auth/google").send({ credential: CREDENTIAL });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("GOOGLE_INVALID");
  });

  it("requires a credential", async () => {
    const response = await api().post("/api/auth/google").send({});
    expect(response.status).toBe(400);
    expect(google.calls).toEqual([]);
  });
});
