import api from "./api";

// ------------------------------------------------------------
// Reports
// ------------------------------------------------------------

export interface MonthlyReport {
  month: string;
  openingBaki: number;
  creditGiven: number;
  creditCount: number;
  collected: number;
  paymentCount: number;
  netChange: number;
  closingBaki: number;
  collectionRate: number;
  newCustomers: number;
  customersOwing: number;
  topDebtors: { customerId: string; name: string; phone: string; balance: number }[];
  daily: { date: string; credit: number; payment: number }[];
}

export async function getMonthlyReport(month: string) {
  const response = await api.get<{ data: MonthlyReport }>("/reports/monthly", { params: { month } });
  return response.data.data;
}

/** Downloads the month's CSV (authenticated request, then a local file save). */
export async function downloadMonthCsv(month: string) {
  const response = await api.get<Blob>("/reports/monthly/export", {
    params: { month },
    responseType: "blob",
  });

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bakiguard-${month}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------
// Billing
// ------------------------------------------------------------

export interface PlanLimits {
  priceBdt: number;
  maxCustomers: number | null;
  maxStaff: number;
  reportExport: boolean;
}

export interface BillingInfo {
  plan: "free" | "pro";
  expiresAt: string | null;
  limits: PlanLimits;
  usage: { customers: number; staff: number };
  plans: { free: PlanLimits; pro: PlanLimits & { periodDays: number } };
  payTo: { method: "bkash"; number: string | null; amount: number; reference: string };
  pendingPayment: { trxId: string; amount: number; createdAt: string } | null;
  payments: {
    _id: string;
    trxId: string;
    amount: number;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    note?: string;
  }[];
}

export async function getBilling() {
  const response = await api.get<{ data: BillingInfo }>("/billing");
  return response.data.data;
}

export async function submitPayment(trxId: string, senderNumber: string) {
  await api.post("/billing/payments", { trxId, senderNumber });
}

// ------------------------------------------------------------
// Team
// ------------------------------------------------------------

export type StaffRole = "manager" | "staff";

export interface TeamMember {
  id: string;
  email: string;
  role: StaffRole;
  status: "invited" | "active";
  name: string | null;
  avatarUrl: string | null;
  /** Pending invites only: the secret for the invite link. */
  inviteToken: string | null;
}

export interface InvitePreview {
  role: StaffRole;
  shopName: string;
  ownerName: string;
}

export function inviteUrl(token: string) {
  return `${window.location.origin}/join/${token}`;
}

export async function getTeam() {
  const response = await api.get<{ data: TeamMember[] }>("/staff");
  return response.data.data;
}

export async function inviteMember(email: string, role: StaffRole) {
  const response = await api.post<{ data: { inviteToken: string } }>("/staff/invites", { email, role });
  return response.data.data.inviteToken;
}

export async function changeMemberRole(id: string, role: StaffRole) {
  await api.patch(`/staff/${id}`, { role });
}

export async function removeMember(id: string) {
  await api.delete(`/staff/${id}`);
}

export async function previewInvite(token: string) {
  const response = await api.get<{ data: InvitePreview }>(`/staff/join/${encodeURIComponent(token)}`);
  return response.data.data;
}

export async function joinShop(token: string) {
  await api.post(`/staff/join/${encodeURIComponent(token)}`);
}

export async function leaveShop() {
  await api.post("/staff/leave");
}
