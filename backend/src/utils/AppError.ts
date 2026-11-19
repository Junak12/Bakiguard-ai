/**
 * An error that is safe to show to the client.
 * Anything thrown that is NOT an AppError is treated as a bug:
 * it is logged in full and the client only sees a generic 500.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "ERROR",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(400, message, code);
  }

  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED") {
    return new AppError(401, message, code);
  }

  static forbidden(message = "You do not have access to this resource") {
    return new AppError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Resource not found") {
    return new AppError(404, message, "NOT_FOUND");
  }

  static conflict(message: string, code = "CONFLICT") {
    return new AppError(409, message, code);
  }

  static unavailable(message: string, code = "SERVICE_UNAVAILABLE") {
    return new AppError(503, message, code);
  }
}
