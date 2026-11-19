import bcrypt from "bcryptjs";

import { User, type IUser } from "../model/User.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";
import type {
  LoginInput,
  OtpVerifyInput,
  RegisterInput,
  UpdateProfileInput,
} from "../validators/auth.validator.js";
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
  "name" | "phone" | "email" | "shopName" | "language" | "defaultCreditDays"
> & { _id: unknown };

export function toPublicUser(user: UserLike) {
  return {
    id: String(user._id),
    name: user.name,
    phone: user.phone ?? null,
    email: user.email ?? null,
    shopName: user.shopName ?? null,
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

  return { user: toPublicUser(user!), isNewUser, ...tokens };
}

// ============================================================
// EMAIL + PASSWORD (accounts created before phone login)
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
    password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
  });

  const tokens = await issueTokens(user._id.toString(), client);

  return { user: toPublicUser(user), ...tokens };
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

  return { user: toPublicUser(user), ...tokens };
}

// ============================================================
// PROFILE
// ============================================================

export async function getUserById(userId: string) {
  const user = await User.findById(userId).lean();

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return toPublicUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: input },
    { returnDocument: "after", runValidators: true }
  ).lean();

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return toPublicUser(user);
}
