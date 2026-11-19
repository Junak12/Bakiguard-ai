import "dotenv/config";
import { z } from "zod";

/**
 * All configuration is read and validated once, at startup.
 * The process refuses to boot with a missing or malformed value
 * instead of failing later on the first request that needs it.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Comma-separated list of allowed browser origins.
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),

  // Short-lived access token; the refresh cookie keeps users signed in.
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),

  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),

  // Shared secret the AI service checks; empty disables the check (dev only).
  AI_SERVICE_API_KEY: z.string().default(""),

  AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),

  // Number of reverse proxies in front of the API (load balancer, nginx).
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");

  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

if (
  parsed.data.NODE_ENV === "production" &&
  !parsed.data.AI_SERVICE_API_KEY
) {
  console.error("AI_SERVICE_API_KEY is required in production");
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  allowedOrigins: parsed.data.FRONTEND_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
