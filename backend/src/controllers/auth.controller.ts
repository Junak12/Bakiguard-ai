import type { CookieOptions, Request, Response } from "express";

import { env } from "../config/env.js";
import { getActorId, type AuthRequest } from "../middleware/auth.middleware.js";
import {
  getUserById,
  loginUser,
  loginWithCode,
  loginWithGoogle,
  registerUser,
  requestLoginCode,
  updateProfile,
} from "../services/auth.service.js";
import { revokeSession, rotateSession } from "../services/session.service.js";
import { AppError } from "../utils/AppError.js";
import { generateAccessToken } from "../utils/jwt.js";
import {
  googleLoginSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  registerSchema,
  updateProfileSchema,
} from "../validators/auth.validator.js";

export const REFRESH_COOKIE = "bg_refresh";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  path: "/api/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};

function clientInfo(req: Request) {
  return {
    userAgent: req.get("user-agent"),
    ip: req.ip,
  };
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
}

function clearRefreshCookie(res: Response) {
  const { maxAge: _maxAge, ...options } = refreshCookieOptions;
  res.clearCookie(REFRESH_COOKIE, options);
}

function readRefreshCookie(req: Request): string | undefined {
  const value = req.cookies?.[REFRESH_COOKIE];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Step 1 of phone login: text a code to the number. */
export async function requestOtp(req: Request, res: Response) {
  const { phone } = otpRequestSchema.parse(req.body);

  const result = await requestLoginCode(phone);

  res.status(200).json({
    success: true,
    message: "Code sent",
    data: result,
  });
}

/** Step 2 of phone login: check the code and sign in (or sign up). */
export async function verifyOtp(req: Request, res: Response) {
  const input = otpVerifySchema.parse(req.body);

  const { user, isNewUser, accessToken, refreshToken } = await loginWithCode(
    input,
    clientInfo(req)
  );

  setRefreshCookie(res, refreshToken);

  res.status(isNewUser ? 201 : 200).json({
    success: true,
    message: isNewUser ? "Account created successfully" : "Login successful",
    data: { user, accessToken, isNewUser },
  });
}

/** "Sign in with Google": exchanges a Google ID token for a BakiGuard session. */
export async function googleLogin(req: Request, res: Response) {
  const { credential } = googleLoginSchema.parse(req.body);

  const { user, isNewUser, accessToken, refreshToken } = await loginWithGoogle(
    credential,
    clientInfo(req)
  );

  setRefreshCookie(res, refreshToken);

  res.status(isNewUser ? 201 : 200).json({
    success: true,
    message: isNewUser ? "Account created successfully" : "Login successful",
    data: { user, accessToken, isNewUser },
  });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);

  const { user, accessToken, refreshToken } = await registerUser(
    input,
    clientInfo(req)
  );

  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: { user, accessToken },
  });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);

  const { user, accessToken, refreshToken } = await loginUser(
    input,
    clientInfo(req)
  );

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user, accessToken },
  });
}

/** Called by the frontend on page load and whenever the access token expires. */
export async function refresh(req: Request, res: Response) {
  const token = readRefreshCookie(req);

  if (!token) {
    throw AppError.unauthorized("Please log in", "SESSION_EXPIRED");
  }

  try {
    const session = await rotateSession(token, clientInfo(req));
    const user = await getUserById(session.userId);

    setRefreshCookie(res, session.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken: generateAccessToken(session.userId),
      },
    });
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
}

export async function logout(req: Request, res: Response) {
  const token = readRefreshCookie(req);

  if (token) {
    await revokeSession(token);
  }

  clearRefreshCookie(res);

  res.status(200).json({
    success: true,
    message: "Logged out",
  });
}

export async function getMe(req: AuthRequest, res: Response) {
  const user = await getUserById(getActorId(req));

  res.status(200).json({
    success: true,
    data: user,
  });
}

export async function updateMe(req: AuthRequest, res: Response) {
  const input = updateProfileSchema.parse(req.body);

  const user = await updateProfile(getActorId(req), req.role ?? "owner", input);

  res.status(200).json({
    success: true,
    message: "Profile updated",
    data: user,
  });
}
