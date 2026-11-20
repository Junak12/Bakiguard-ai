import crypto from "node:crypto";

import mongoose, { Schema, type Document } from "mongoose";

/** 192 random bits; whoever holds the invite link can join (once). */
export function newInviteToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export const STAFF_ROLES = ["manager", "staff"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Owner + staff roles, from most to least access. */
export type ShopRole = "owner" | StaffRole;

/**
 * Someone working in another person's shop.
 * Starts as an invite with a secret link the owner shares (e.g. on WhatsApp);
 * becomes active when a signed-in person opens the link and joins.
 */
export interface IMembership extends Document {
  /** The owner's user id: the shop whose data the member works on. */
  shopId: mongoose.Types.ObjectId;
  /** Set when the invite is accepted. */
  userId?: mongoose.Types.ObjectId | null;
  /** Who the owner meant to invite (a label; joining uses the link). */
  email: string;
  /** Secret in the invite link; cleared once used. */
  inviteToken?: string | null;
  role: StaffRole;
  status: "invited" | "active";
  invitedBy: mongoose.Types.ObjectId;
  acceptedAt?: Date;
  createdAt: Date;
}

const membershipSchema = new Schema<IMembership>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    inviteToken: { type: String, default: () => newInviteToken() },
    role: { type: String, enum: STAFF_ROLES, required: true },
    status: { type: String, enum: ["invited", "active"], default: "invited" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: Date,
  },
  { timestamps: true }
);

// One invite/membership per email per shop.
membershipSchema.index({ shopId: 1, email: 1 }, { unique: true });

// A person works in at most one shop.
membershipSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } }
);

membershipSchema.index(
  { inviteToken: 1 },
  { unique: true, partialFilterExpression: { inviteToken: { $type: "string" } } }
);

export const Membership = mongoose.model<IMembership>("Membership", membershipSchema);
