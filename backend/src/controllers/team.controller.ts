import crypto from "node:crypto";

import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { env } from "../config/env.js";
import { STAFF_ROLES } from "../model/Membership.js";
import { getActorId, getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import {
  approvePayment,
  getBilling,
  listPayments,
  rejectPayment,
  submitPayment,
} from "../services/billing.service.js";
import {
  changeRole,
  countStaff,
  inviteStaff,
  joinWithToken,
  leaveShop,
  listStaff,
  previewInvite,
  removeStaff,
} from "../services/staff.service.js";
import { AppError } from "../utils/AppError.js";
import { bdPhoneSchema, objectIdSchema } from "../validators/common.validator.js";

const idParams = z.object({ id: objectIdSchema });

// ============================================================
// STAFF (owner)
// ============================================================

export async function getStaff(req: AuthRequest, res: Response) {
  res.status(200).json({ success: true, data: await listStaff(getUserId(req)) });
}

export async function invite(req: AuthRequest, res: Response) {
  const input = z
    .object({
      email: z.string().trim().email("Enter a valid email"),
      role: z.enum(STAFF_ROLES),
    })
    .parse(req.body);

  const created = await inviteStaff(getUserId(req), getActorId(req), input);

  res.status(201).json({ success: true, data: created });
}

export async function updateRole(req: AuthRequest, res: Response) {
  const { id } = idParams.parse(req.params);
  const { role } = z.object({ role: z.enum(STAFF_ROLES) }).parse(req.body);

  res.status(200).json({ success: true, data: await changeRole(getUserId(req), id, role) });
}

export async function remove(req: AuthRequest, res: Response) {
  const { id } = idParams.parse(req.params);

  await removeStaff(getUserId(req), id);

  res.status(200).json({ success: true, message: "Removed" });
}

// ============================================================
// INVITE LINKS (the invited person)
// ============================================================

const tokenParams = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{32}$/, "Invalid invite link"),
});

export async function getInvite(req: AuthRequest, res: Response) {
  const { token } = tokenParams.parse(req.params);

  res.status(200).json({ success: true, data: await previewInvite(token) });
}

export async function join(req: AuthRequest, res: Response) {
  const { token } = tokenParams.parse(req.params);

  res.status(200).json({ success: true, data: await joinWithToken(getActorId(req), token) });
}

export async function leave(req: AuthRequest, res: Response) {
  await leaveShop(getActorId(req));

  res.status(200).json({ success: true, message: "You left the shop" });
}

// ============================================================
// BILLING (owner)
// ============================================================

export async function billing(req: AuthRequest, res: Response) {
  const shopId = getUserId(req);

  res.status(200).json({ success: true, data: await getBilling(shopId, await countStaff(shopId)) });
}

export async function reportPayment(req: AuthRequest, res: Response) {
  const input = z
    .object({
      trxId: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{8,12}$/, "Enter the bKash transaction ID (e.g. 9AB2CD3EF4)"),
      senderNumber: bdPhoneSchema,
    })
    .parse(req.body);

  const payment = await submitPayment(getUserId(req), input);

  res.status(201).json({ success: true, data: payment });
}

// ============================================================
// ADMIN (you, approving bKash payments)
// ============================================================

/** X-Admin-Key must match ADMIN_API_KEY. Disabled when the key is empty. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const provided = req.get("x-admin-key") ?? "";
  const expected = env.ADMIN_API_KEY;

  const ok =
    expected.length > 0 &&
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  if (!ok) return next(AppError.notFound("Not found"));

  next();
}

export async function adminListPayments(req: Request, res: Response) {
  const { status } = z
    .object({ status: z.enum(["pending", "approved", "rejected"]).default("pending") })
    .parse(req.query);

  res.status(200).json({ success: true, data: await listPayments(status) });
}

export async function adminApprove(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);

  res.status(200).json({ success: true, data: await approvePayment(id) });
}

export async function adminReject(req: Request, res: Response) {
  const { id } = idParams.parse(req.params);
  const { note } = z.object({ note: z.string().trim().max(300).optional() }).parse(req.body ?? {});

  res.status(200).json({ success: true, data: await rejectPayment(id, note) });
}
