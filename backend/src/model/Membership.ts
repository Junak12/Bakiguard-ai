import mongoose, { Schema, type Document } from "mongoose";

export const STAFF_ROLES = ["manager", "staff"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/** Owner + staff roles, from most to least access. */
export type ShopRole = "owner" | StaffRole;

/**
 * Someone working in another person's shop.
 * Starts as an invite to an email address; becomes active when that person
 * signs in with the same (verified) email and accepts.
 */
export interface IMembership extends Document {
  /** The owner's user id: the shop whose data the member works on. */
  shopId: mongoose.Types.ObjectId;
  /** Set when the invite is accepted. */
  userId?: mongoose.Types.ObjectId | null;
  email: string;
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

membershipSchema.index({ email: 1, status: 1 });

export const Membership = mongoose.model<IMembership>("Membership", membershipSchema);
