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
    // Only pending invites still have a link to (re)share.
    inviteToken: member.status === "invited" ? (member.inviteToken ?? null) : null,
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

    return {
      id: String(invite._id),
      email: invite.email,
      role: invite.role,
      status: invite.status,
      inviteToken: invite.inviteToken,
    };
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
// The invited person's side (holds the invite link)
// ------------------------------------------------------------

async function findInvite(token: string) {
  const invite = await Membership.findOne({ inviteToken: token, status: "invited" })
    .populate<{ shopId: { _id: mongoose.Types.ObjectId; name: string; shopName?: string } }>({
      path: "shopId",
      select: "name shopName",
    })
    .lean();

  if (!invite || !invite.shopId) {
    throw AppError.notFound("This invite link is no longer valid. Ask the shop owner for a new one.");
  }

  return invite;
}

/** What the link is for, so the person can decide before joining. */
export async function previewInvite(token: string) {
  const invite = await findInvite(token);

  return {
    role: invite.role,
    shopName: invite.shopId.shopName || invite.shopId.name,
    ownerName: invite.shopId.name,
  };
}

/** Joins the shop behind an invite link. The link works once. */
export async function joinWithToken(actorId: string, token: string) {
  const invite = await findInvite(token);

  if (String(invite.shopId._id) === actorId) {
    throw AppError.badRequest("This is your own shop.", "INVITE_SELF");
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
      "This account has its own customers or staff, so it can't join another shop. Use a different account.",
      "HAS_OWN_SHOP"
    );
  }

  const member = await Membership.findOneAndUpdate(
    { _id: invite._id, status: "invited" },
    {
      $set: { userId: actorId, status: "active", acceptedAt: new Date() },
      $unset: { inviteToken: 1 },
    },
    { returnDocument: "after" }
  ).lean();

  if (!member) throw AppError.notFound("This invite link was already used.");

  return { shopId: String(member.shopId), role: member.role };
}

export async function leaveShop(actorId: string) {
  const result = await Membership.deleteOne({ userId: actorId, status: "active" });

  if (result.deletedCount === 0) throw AppError.notFound("You are not a member of another shop");
}
