import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(AppError.unauthorized());
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      AppError.unauthorized("Invalid authorization header", "INVALID_TOKEN")
    );
  }

  try {
    req.userId = verifyAccessToken(token).userId;
    return next();
  } catch {
    // The frontend reacts to TOKEN_EXPIRED by calling /auth/refresh.
    return next(
      AppError.unauthorized("Invalid or expired token", "TOKEN_EXPIRED")
    );
  }
}

/** For use inside routes protected by `authenticate`. */
export function getUserId(req: AuthRequest): string {
  if (!req.userId) {
    throw AppError.unauthorized();
  }

  return req.userId;
}
