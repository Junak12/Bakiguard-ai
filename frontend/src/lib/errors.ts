import axios from "axios";

export interface ApiError {
  status: number | null;
  code: string | null;
  message: string | null;
  /** Field errors ({ field: [messages] }) or extra details from the API. */
  errors: Record<string, unknown> | null;
  /** True when the request never reached the server. */
  network: boolean;
}

/** Normalizes anything thrown by an API call into one shape. */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { code?: string; message?: string; errors?: Record<string, unknown> }
      | undefined;

    return {
      status: error.response?.status ?? null,
      code: data?.code ?? null,
      message: data?.message ?? null,
      errors: data?.errors ?? null,
      network: !error.response,
    };
  }

  return { status: null, code: null, message: null, errors: null, network: false };
}

/** First field-level validation message, if any. */
export function firstFieldError(error: ApiError): string | null {
  if (!error.errors) return null;

  for (const value of Object.values(error.errors)) {
    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  return null;
}
