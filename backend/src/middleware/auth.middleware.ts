import type { NextFunction, Request, Response } from "express";

import { Membership, type ShopRole } from "../model/Membership.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export interface AuthRequest extends Request {
  /**
   * The SHOP whose data this request reads and writes (the owner's user id).
   * For an owner it's their own id; for staff, their employer's.
   * Every data query is scoped by this.
   */
  userId?: string;
  /** The person actually signed in (for profile, audit, "entered by"). */
  actorId?: string;
  role?: ShopRole;
}

/**
 * Verifies the access token, then resolves which shop the person works in.
 * Membership is checked on every request so removing a staff member takes
 * effect immediately, not when their token expires.
 */
export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(AppError.unauthorized());
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(AppError.unauthorized("Invalid authorization header", "INVALID_TOKEN"));
  }

  let actorId: string;

  try {
    actorId = verifyAccessToken(token).userId;
  } catch {
    // The frontend reacts to TOKEN_EXPIRED by calling /auth/refresh.
    return next(AppError.unauthorized("Invalid or expired token", "TOKEN_EXPIRED"));
  }

  const membership = await Membership.findOne(
    { userId: actorId, status: "active" },
    { shopId: 1, role: 1 }
  ).lean();

  req.actorId = actorId;
  req.userId = membership ? membership.shopId.toString() : actorId;
  req.role = membership ? membership.role : "owner";

  return next();
}

/** The shop id. For use inside routes protected by `authenticate`. */
export function getUserId(req: AuthRequest): string {
  if (!req.userId) {
    throw AppError.unauthorized();
  }

  return req.userId;
}

/** The signed-in person (not necessarily the shop owner). */
export function getActorId(req: AuthRequest): string {
  if (!req.actorId) {
    throw AppError.unauthorized();
  }

  return req.actorId;
}

/** Restricts a route to some roles, e.g. requireRole("owner"). */
export function requireRole(...roles: ShopRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return next(AppError.forbidden("You don't have permission to do this."));
    }
    next();
  };
}
