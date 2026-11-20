import request from "supertest";

import app from "../src/app.js";

export const api = () => request(app);

let counter = 0;

export async function registerUser(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  counter += 1;

  const credentials = {
    name: "Rahim Store",
    email: `owner${counter}@example.com`,
    password: "strong-password-1",
    ...overrides,
  };

  const response = await api().post("/api/auth/register").send(credentials);

  if (response.status !== 201) {
    throw new Error(`register failed: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return {
    credentials,
    token: response.body.data.accessToken as string,
    cookie: response.headers["set-cookie"] as unknown as string[],
    auth: { Authorization: `Bearer ${response.body.data.accessToken}` },
  };
}

export async function createCustomer(
  auth: Record<string, string>,
  overrides: Partial<{ name: string; phone: string; address: string }> = {}
) {
  counter += 1;

  const response = await api()
    .post("/api/customers")
    .set(auth)
    .send({
      name: "Karim Mia",
      phone: `0171${String(1000000 + counter).slice(-7)}`,
      ...overrides,
    });

  if (response.status !== 201) {
    throw new Error(`create customer failed: ${response.status} ${JSON.stringify(response.body)}`);
  }

  return response.body.data as { _id: string; phone: string; totalDue: number };
}

export function recordTransaction(
  auth: Record<string, string>,
  customerId: string,
  type: "CREDIT" | "PAYMENT",
  amount: number
) {
  return api()
    .post("/api/transactions")
    .set(auth)
    .send({ customerId, type, amount });
}
