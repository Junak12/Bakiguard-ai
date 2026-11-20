import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";

import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.path}`));
}

/**
 * Single place that turns errors into HTTP responses.
 * Response shape: { success: false, message, code, errors? }
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: error.flatten().fieldErrors,
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${error.path}`,
      code: "INVALID_ID",
    });
  }

  if (isDuplicateKeyError(error)) {
    return res.status(409).json({
      success: false,
      message: "This record already exists",
      code: "DUPLICATE",
    });
  }

  // Malformed JSON body from express.json()
  if (isBodyParseError(error)) {
    return res.status(400).json({
      success: false,
      message: "Malformed request body",
      code: "BAD_JSON",
    });
  }

  (req.log ?? logger).error({ err: error }, "Unhandled error");

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    code: "INTERNAL_ERROR",
  });
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === 11000
  );
}

function isBodyParseError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type: unknown }).type === "entity.parse.failed"
  );
}
