import mongoose from "mongoose";

import { Customer } from "../model/Customer.js";
import { Membership, type StaffRole } from "../model/Membership.js";
import { User } from "../model/User.js";
import { AppError } from "../utils/AppError.js";
import { assertStaffAllowed } from "./billing.service.js";

export async function countStaff(shopId: string) {
  return Membership.countDocuments({ shopId });
}

/** Members and pending invites of a shop. */
export async function listStaff(shopId: string) {
  const members = await Membership.find({ shopId })
    .sort({ createdAt: 1 })
    .populate<{ userId: { name: string; avatarUrl?: string } | null }>({
      path: "userId",
      select: "name avatarUrl",
    })
    .lean();

  return members.map((member) => ({
    id: String(member._id),
    email: member.email,
    role: member.role,
    status: member.status,
    name: member.userId?.name ?? null,
    avatarUrl: member.userId?.avatarUrl ?? null,
    acceptedAt: member.acceptedAt ?? null,
    createdAt: member.createdAt,
  }));
}

export async function inviteStaff(
  shopId: string,
  actorId: string,
  input: { email: string; role: StaffRole }
) {
  const email = input.email.toLowerCase();

  const owner = await User.findById(shopId, { email: 1 }).lean();
  if (owner?.email === email) {
    throw AppError.badRequest("You can't invite yourself.", "INVITE_SELF");
  }

  await assertStaffAllowed(shopId, await countStaff(shopId));

  try {
    const invite = await Membership.create({
      shopId,
      email,
      role: input.role,
      invitedBy: actorId,
    });

    return { id: String(invite._id), email: invite.email, role: invite.role, status: invite.status };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw AppError.conflict("This email is already invited.", "ALREADY_INVITED");
    }
    throw error;
  }
}

export async function changeRole(shopId: string, membershipId: string, role: StaffRole) {
  const member = await Membership.findOneAndUpdate(
    { _id: membershipId, shopId },
    { $set: { role } },
    { returnDocument: "after" }
  ).lean();

  if (!member) throw AppError.notFound("Staff member not found");

  return { id: String(member._id), role: member.role };
}

/** Removes a member or cancels an invite. Takes effect on their next request. */
export async function removeStaff(shopId: string, membershipId: string) {
  const result = await Membership.deleteOne({ _id: membershipId, shopId });

  if (result.deletedCount === 0) throw AppError.notFound("Staff member not found");
}

// ------------------------------------------------------------
// The invited person's side
// ------------------------------------------------------------

async function verifiedEmailOf(actorId: string) {
  const user = await User.findById(actorId, { email: 1, googleId: 1 }).lean();

  // Only Google sign-in proves the person owns the address.
  return user?.googleId && user.email ? user.email : null;
}

export async function myInvites(actorId: string) {
  const email = await verifiedEmailOf(actorId);

  if (!email) return [];

  const invites = await Membership.find({ email, status: "invited" })
    .populate<{ shopId: { name: string; shopName?: string } }>({ path: "shopId", select: "name shopName" })
    .lean();

  return invites.map((invite) => ({
    id: String(invite._id),
    role: invite.role,
    shopName: invite.shopId?.shopName || invite.shopId?.name || "",
    ownerName: invite.shopId?.name ?? "",
  }));
}

export async function acceptInvite(actorId: string, membershipId: string) {
  if (!mongoose.isValidObjectId(membershipId)) throw AppError.badRequest("Invalid invite");

  const email = await verifiedEmailOf(actorId);

  if (!email) {
    throw AppError.forbidden("Sign in with the Google account the invite was sent to.");
  }

  const [ownCustomers, ownStaff, existing] = await Promise.all([
    Customer.exists({ userId: actorId }),
    Membership.exists({ shopId: actorId }),
    Membership.exists({ userId: actorId, status: "active" }),
  ]);

  if (existing) {
    throw AppError.conflict("You already work in a shop. Leave it first.", "ALREADY_MEMBER");
  }

  if (ownCustomers || ownStaff) {
    // Joining would hide their own khata; don't let that happen silently.
    throw AppError.conflict(
      "You have your own shop with customers or staff, so you can't join another shop with this account.",
      "HAS_OWN_SHOP"
    );
  }

  const member = await Membership.findOneAndUpdate(
    { _id: membershipId, email, status: "invited" },
    { $set: { userId: actorId, status: "active", acceptedAt: new Date() } },
    { returnDocument: "after" }
  ).lean();

  if (!member) throw AppError.notFound("Invite not found or already used");

  return { shopId: String(member.shopId), role: member.role };
}

export async function leaveShop(actorId: string) {
  const result = await Membership.deleteOne({ userId: actorId, status: "active" });

  if (result.deletedCount === 0) throw AppError.notFound("You are not a member of another shop");
}
