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

  // Which SMS gateway delivers OTPs (and, in Phase 2, reminders).
  // "console" prints messages to the log: development only.
  SMS_PROVIDER: z.enum(["console"]).default("console"),

  // Lets a production build use the console provider (local Docker demos).
  ALLOW_CONSOLE_SMS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  OTP_TTL_MINUTES: z.coerce.number().int().min(1).max(30).default(5),

  // Phone + OTP login is built but switched off until an SMS provider is chosen.
  PHONE_LOGIN_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  // OAuth client ID(s) from Google Cloud Console (comma-separated).
  // Empty disables "Sign in with Google".
  GOOGLE_CLIENT_ID: z.string().default(""),

  // bKash number shop owners send subscription payments to (shown on the Upgrade page).
  BILLING_BKASH_NUMBER: z.string().default(""),

  // Secret for the admin endpoints that approve payments. Empty disables them.
  ADMIN_API_KEY: z.string().default(""),
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

if (
  parsed.data.NODE_ENV === "production" &&
  parsed.data.PHONE_LOGIN_ENABLED &&
  parsed.data.SMS_PROVIDER === "console" &&
  !parsed.data.ALLOW_CONSOLE_SMS
) {
  // Would write login codes into the logs and never reach users' phones.
  console.error(
    "SMS_PROVIDER=console is not allowed in production (set a real provider, " +
      "or ALLOW_CONSOLE_SMS=true for a local demo)"
  );
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  googleClientIds: parsed.data.GOOGLE_CLIENT_ID.split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  allowedOrigins: parsed.data.FRONTEND_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
