import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import {
  clearSession,
  getAccessToken,
  refreshAccessToken,
} from "./session";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST: attach the in-memory access token
// ============================================================

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ============================================================
// RESPONSE: on 401, refresh once and retry; otherwise go to login
// ============================================================

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthRoute = config?.url?.startsWith("/auth/");

    if (
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      isAuthRoute
    ) {
      return Promise.reject(error);
    }

    config._retried = true;

    const token = await refreshAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      return api(config);
    }

    clearSession();

    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      // Outside React (no router here); a full reload also resets all state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
