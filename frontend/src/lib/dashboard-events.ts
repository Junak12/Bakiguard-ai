export const DASHBOARD_UPDATED =
  "dashboard-updated";

export function notifyDashboardUpdated() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new Event(DASHBOARD_UPDATED)
  );
}