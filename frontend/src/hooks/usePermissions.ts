"use client";

import { useSessionUser } from "./useSessionUser";

/**
 * What the signed-in person may do in this shop. Mirrors the backend's route
 * guards (the backend enforces; this only hides controls that would fail).
 */
export function usePermissions() {
  const user = useSessionUser();
  const role = user?.role ?? "owner";

  const ownerOrManager = role === "owner" || role === "manager";

  return {
    role,
    isOwner: role === "owner",
    canSeeReports: ownerOrManager,
    canSetLimits: ownerOrManager,
    canRemoveCustomers: ownerOrManager,
    canResetLinks: ownerOrManager,
    canManageTeam: role === "owner",
    canManageBilling: role === "owner",
    canEditShopSettings: role === "owner",
  };
}
