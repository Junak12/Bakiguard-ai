import axios from "axios";

/**
 * Session handling.
 *
 * - The short-lived access token lives only in memory (never localStorage),
 *   so an injected script cannot steal a long-lived credential.
 * - The long-lived refresh token is an httpOnly cookie the browser sends to
 *   /api/auth/* automatically; JavaScript can never read it.
 * - On page load (or when the access token expires) we call /auth/refresh
 *   to get a new access token.
 */

export interface SessionUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  shopName: string | null;
  paymentInfo: string | null;
  language: "bn" | "en";
  defaultCreditDays: number;
}

let accessToken: string | null = null;
let currentUser: SessionUser | null = null;
let refreshInFlight: Promise<string | null> | null = null;

const listeners = new Set<() => void>();

/** For useSyncExternalStore: re-render when the signed-in user changes. */
export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

// A bare client (no interceptors) so a failing refresh can't loop.
const authClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function setSession(token: string, user: SessionUser) {
  accessToken = token;
  currentUser = user;
  emit();
}

/** After a profile edit: same token, fresh user details. */
export function setCurrentUser(user: SessionUser) {
  currentUser = user;
  emit();
}

export function clearSession() {
  accessToken = null;
  currentUser = null;
  emit();
}

/**
 * Gets a fresh access token using the refresh cookie.
 * Concurrent callers share one request, because the server rotates the
 * refresh token and a second parallel call would use an already-spent one.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = authClient
      .post("/auth/refresh")
      .then((response) => {
        const { accessToken: token, user } = response.data.data;
        setSession(token, user);
        return token as string;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

/** Ensures there is a valid session. Returns false if the user must log in. */
export async function restoreSession(): Promise<boolean> {
  if (accessToken) return true;
  return (await refreshAccessToken()) !== null;
}

export async function logout() {
  try {
    await authClient.post("/auth/logout");
  } finally {
    clearSession();
  }
}
