import bcrypt from "bcryptjs";

import { User } from "../model/User.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";
import { createSession } from "./session.service.js";

const BCRYPT_ROUNDS = 12;

// Compared against when the email does not exist, so a missing account
// takes as long as a wrong password and emails can't be probed by timing.
const DUMMY_HASH = bcrypt.hashSync("bakiguard-timing-guard", BCRYPT_ROUNDS);

interface ClientInfo {
  userAgent?: string;
  ip?: string;
}

function toPublicUser(user: { _id: unknown; name: string; email: string }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
  };
}

async function issueTokens(userId: string, client: ClientInfo) {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: await createSession(userId, client),
  };
}

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

  if (!user || !passwordMatches) {
    throw AppError.unauthorized(
      "Invalid email or password",
      "INVALID_CREDENTIALS"
    );
  }

  const tokens = await issueTokens(user._id.toString(), client);

  return { user: toPublicUser(user), ...tokens };
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId).lean();

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return toPublicUser(user);
}
