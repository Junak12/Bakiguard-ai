import api from "./api";
import { setSession, type SessionUser } from "./session";

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: SessionUser;
    accessToken: string;
    isNewUser?: boolean;
  };
}

export interface OtpRequestResult {
  isNewUser: boolean;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

// ------------------------------------------------------------
// Phone + OTP
// ------------------------------------------------------------

export async function requestOtp(phone: string) {
  const response = await api.post<{ data: OtpRequestResult }>("/auth/otp/request", { phone });
  return response.data.data;
}

export async function verifyOtp(input: {
  phone: string;
  code: string;
  name?: string;
  shopName?: string;
}) {
  const response = await api.post<AuthResponse>("/auth/otp/verify", input);

  setSession(response.data.data.accessToken, response.data.data.user);

  return response.data.data;
}

// ------------------------------------------------------------
// Google
// ------------------------------------------------------------

/** Exchanges a Google Identity Services ID token for a BakiGuard session. */
export async function googleLogin(credential: string) {
  const response = await api.post<AuthResponse>("/auth/google", { credential });

  setSession(response.data.data.accessToken, response.data.data.user);

  return response.data.data;
}

// ------------------------------------------------------------
// Email + password (older accounts)
// ------------------------------------------------------------

export async function loginUser(data: { email: string; password: string }) {
  const response = await api.post<AuthResponse>("/auth/login", data);

  setSession(response.data.data.accessToken, response.data.data.user);

  return response.data.data;
}

// ------------------------------------------------------------
// Profile
// ------------------------------------------------------------

export async function updateProfile(
  data: Partial<
    Pick<SessionUser, "name" | "shopName" | "language" | "defaultCreditDays"> & {
      paymentInfo: string;
    }
  >
) {
  const response = await api.patch<{ data: SessionUser }>("/auth/me", data);
  return response.data.data;
}

export { logout, restoreSession } from "./session";
