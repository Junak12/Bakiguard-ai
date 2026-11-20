import bcrypt from "bcryptjs";

import { Membership, type ShopRole } from "../model/Membership.js";
import { User, type IUser } from "../model/User.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";
import type {
  LoginInput,
  OtpVerifyInput,
  RegisterInput,
  UpdateProfileInput,
} from "../validators/auth.validator.js";
import { activePlan } from "./billing.service.js";
import { sendOtp, verifyOtp } from "./otp.service.js";
import { createSession } from "./session.service.js";

const BCRYPT_ROUNDS = 12;

// Compared against when the email does not exist, so a missing account
// takes as long as a wrong password and emails can't be probed by timing.
const DUMMY_HASH = bcrypt.hashSync("bakiguard-timing-guard", BCRYPT_ROUNDS);

interface ClientInfo {
  userAgent?: string;
  ip?: string;
}

type UserLike = Pick<
  IUser,
  | "name"
  | "phone"
  | "email"
  | "shopName"
  | "paymentInfo"
  | "avatarUrl"
  | "language"
  | "defaultCreditDays"
> & { _id: unknown };

export function toPublicUser(user: UserLike) {
  return {
    id: String(user._id),
    name: user.name,
    phone: user.phone ?? null,
    email: user.email ?? null,
    avatarUrl: user.avatarUrl ?? null,
    shopName: user.shopName ?? null,
    paymentInfo: user.paymentInfo ?? null,
    language: user.language ?? "bn",
    defaultCreditDays: user.defaultCreditDays ?? 30,
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;

async function issueTokens(userId: string, client: ClientInfo) {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: await createSession(userId, client),
  };
}

// ============================================================
// PHONE + OTP
// ============================================================

/**
 * Sends a login code. `isNewUser` tells the app whether to also ask for the
 * owner's name and shop name on the next screen.
 */
export async function requestLoginCode(phone: string) {
  const [delivery, existing] = await Promise.all([
    sendOtp(phone),
    User.exists({ phone }),
  ]);

  return { ...delivery, isNewUser: !existing };
}

/** Verifies the code, then signs in, or creates the account on first login. */
export async function loginWithCode(input: OtpVerifyInput, client: ClientInfo) {
  const existing = await User.findOne({ phone: input.phone }).lean();

  // Check required sign-up fields before consuming the code, so a missing
  // name doesn't force the user to request a new SMS.
  if (!existing && !input.name) {
    throw new AppError(400, "Please enter your name", "NAME_REQUIRED", {
      name: ["Please enter your name"],
    });
  }

  await verifyOtp(input.phone, input.code);

  let user = existing;
  let isNewUser = false;

  if (!user) {
    try {
      user = (
        await User.create({
          name: input.name,
          phone: input.phone,
          shopName: input.shopName,
        })
      ).toObject();
      isNewUser = true;
    } catch (error) {
      // Two devices finishing sign-up at the same moment.
      if ((error as { code?: number }).code !== 11000) throw error;
      user = await User.findOne({ phone: input.phone }).lean();
    }
  }

  const tokens = await issueTokens(String(user!._id), client);

  return { user: await getUserById(String(user!._id)), isNewUser, ...tokens };
}

// ============================================================
// EMAIL + PASSWORD
// ============================================================

export async function registerUser(input: RegisterInput, client: ClientInfo) {
  const email = input.email.toLowerCase();

  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw AppError.conflict(
      "An account with this email already exists",
      "EMAIL_TAKEN"
    );
  }

  const user = await User.create({
    name: input.name,
    email,
    shopName: input.shopName,
    password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
  });

  const tokens = await issueTokens(user._id.toString(), client);

  return { user: await getUserById(String(user._id)), ...tokens };
}

export async function loginUser(input: LoginInput, client: ClientInfo) {
  const user = await User.findOne({
    email: input.email.toLowerCase(),
  }).select("+password");

  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.password ?? DUMMY_HASH
  );

  if (!user || !user.password || !passwordMatches) {
    throw AppError.unauthorized(
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );
  }

  const tokens = await issueTokens(user._id.toString(), client);

  return { user: await getUserById(String(user._id)), ...tokens };
}

// ============================================================
// PROFILE
// ============================================================

/** Fields that describe the SHOP; only the owner may change them. */
const SHOP_FIELDS = ["shopName", "paymentInfo", "defaultCreditDays"] as const;

/**
 * The signed-in person as the app sees them: their own name/language plus the
 * shop they work in (its name, payment info, credit term, plan) and their role.
 */
export async function getUserById(actorId: string) {
  const user = await User.findById(actorId).lean();

  if (!user) {
    throw AppError.notFound("User not found");
  }

  const membership = await Membership.findOne(
    { userId: actorId, status: "active" },
    { shopId: 1, role: 1 }
  ).lean();

  const shop = membership ? await User.findById(membership.shopId).lean() : user;

  if (!shop) {
    throw AppError.notFound("Shop not found");
  }

  const role: ShopRole = membership ? membership.role : "owner";

  return {
    ...toPublicUser(user),
    role,
    shopId: String(shop._id),
    ownerName: shop.name,
    shopName: shop.shopName ?? null,
    paymentInfo: shop.paymentInfo ?? null,
    defaultCreditDays: shop.defaultCreditDays ?? 30,
    plan: activePlan(shop),
    planExpiresAt: shop.planExpiresAt ?? null,
  };
}

export type SessionUser = Awaited<ReturnType<typeof getUserById>>;

export async function updateProfile(actorId: string, role: ShopRole, input: UpdateProfileInput) {
  if (role !== "owner" && SHOP_FIELDS.some((field) => field in input)) {
    throw AppError.forbidden("Only the shop owner can change shop settings.");
  }

  const user = await User.findByIdAndUpdate(
    actorId,
    { $set: input },
    { returnDocument: "after", runValidators: true }
  ).lean();

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return getUserById(actorId);
}
