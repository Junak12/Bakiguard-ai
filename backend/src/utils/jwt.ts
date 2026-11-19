import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";

export interface AccessTokenPayload {
  userId: string;
}

export function generateAccessToken(userId: string) {
  return jwt.sign({ userId } satisfies AccessTokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

/** Throws if the token is invalid or expired. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof (decoded as Record<string, unknown>).userId !== "string"
  ) {
    throw new Error("Malformed token payload");
  }

  return { userId: (decoded as Record<string, string>).userId };
}
