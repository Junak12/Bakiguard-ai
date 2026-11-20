import { OAuth2Client } from "google-auth-library";

import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const client = new OAuth2Client();

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/**
 * Verifies a Google Identity Services ID token (signature, expiry, issuer and
 * that it was issued for OUR client id) and returns the verified profile.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (env.googleClientIds.length === 0) {
    throw new AppError(503, "Google sign-in is not configured", "GOOGLE_NOT_CONFIGURED");
  }

  let payload;

  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientIds });
    payload = ticket.getPayload();
  } catch {
    throw AppError.unauthorized("Google sign-in failed. Please try again.", "GOOGLE_INVALID");
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw AppError.unauthorized("Your Google email is not verified.", "GOOGLE_UNVERIFIED");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    avatarUrl: payload.picture,
  };
}
