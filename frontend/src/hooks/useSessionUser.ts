"use client";

import { useSyncExternalStore } from "react";

import { getCurrentUser, subscribeSession } from "@/lib/session";

/** The signed-in user; updates live after profile changes. */
export function useSessionUser() {
  return useSyncExternalStore(subscribeSession, getCurrentUser, () => null);
}
