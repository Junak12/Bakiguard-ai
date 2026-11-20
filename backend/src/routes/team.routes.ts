import { Router } from "express";

import {
  adminApprove,
  adminListPayments,
  adminReject,
  billing,
  getInvite,
  getStaff,
  invite,
  join,
  leave,
  remove,
  reportPayment,
  requireAdmin,
  updateRole,
} from "../controllers/team.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

export const staffRoutes = Router();

staffRoutes.use(authenticate);

// The invited person's side: anyone signed in who holds the link.
staffRoutes.get("/join/:token", getInvite);
staffRoutes.post("/join/:token", authLimiter, join);
staffRoutes.post("/leave", leave);

// The owner's side.
staffRoutes.get("/", requireRole("owner"), getStaff);
staffRoutes.post("/invites", requireRole("owner"), invite);
staffRoutes.patch("/:id", requireRole("owner"), updateRole);
staffRoutes.delete("/:id", requireRole("owner"), remove);

export const billingRoutes = Router();

billingRoutes.use(authenticate, requireRole("owner"));
billingRoutes.get("/", billing);
billingRoutes.post("/payments", authLimiter, reportPayment);

/** For the operator: approve bKash payments. Needs X-Admin-Key. */
export const adminRoutes = Router();

adminRoutes.use(authLimiter, requireAdmin);
adminRoutes.get("/payments", adminListPayments);
adminRoutes.post("/payments/:id/approve", adminApprove);
adminRoutes.post("/payments/:id/reject", adminReject);
