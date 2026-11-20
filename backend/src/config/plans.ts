/**
 * Subscription plans. Prices are placeholders: change them here only.
 * `null` means unlimited.
 */
export const PLANS = {
  free: {
    priceBdt: 0,
    maxCustomers: 50 as number | null,
    maxStaff: 0,
    reportExport: false,
  },
  pro: {
    priceBdt: 199,
    periodDays: 30,
    maxCustomers: null as number | null,
    maxStaff: 5,
    reportExport: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
