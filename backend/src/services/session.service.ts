import crypto from "node:crypto";

import { env } from "../config/env.js";
import { Session } from "../model/Session.js";
import { AppError } from "../utils/AppError.js";

interface ClientInfo {
  userAgent?: string;
  ip?: string;
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function newExpiry() {
  return new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  );
}

/** Creates a session and returns the raw refresh token (shown to the client once). */
export async function createSession(userId: string, client: ClientInfo) {
  const refreshToken = crypto.randomBytes(48).toString("base64url");

  await Session.create({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: newExpiry(),
    userAgent: client.userAgent?.slice(0, 300),
    ip: client.ip,
  });

  return refreshToken;
}

/**
 * Exchanges a refresh token for a new one (rotation).
 * The old token stops working immediately, so a stolen token
 * can only be used once before the real user's next refresh fails it.
 */
export async function rotateSession(refreshToken: string, client: ClientInfo) {
  const newToken = crypto.randomBytes(48).toString("base64url");

  const session = await Session.findOneAndUpdate(
    {
      tokenHash: hashToken(refreshToken),
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        tokenHash: hashToken(newToken),
        expiresAt: newExpiry(),
        userAgent: client.userAgent?.slice(0, 300),
        ip: client.ip,
      },
    },
    { returnDocument: "after" }
  );

  if (!session) {
    throw AppError.unauthorized(
      "Your session has expired. Please log in again.",
      "SESSION_EXPIRED"
    );
  }

  return {
    userId: session.userId.toString(),
    refreshToken: newToken,
  };
}

export async function revokeSession(refreshToken: string) {
  await Session.deleteOne({ tokenHash: hashToken(refreshToken) });
}

export async function revokeAllSessions(userId: string) {
  await Session.deleteMany({ userId });
}
