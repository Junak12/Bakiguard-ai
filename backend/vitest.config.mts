import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Each worker starts its own in-memory MongoDB; too many at once makes startup flaky.
    maxWorkers: 4,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // One in-memory MongoDB per test file; files run in separate workers.
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "mongodb://placeholder-overridden-in-setup",
      JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
      // Nothing listens here, so AI calls fail fast and exercise the fallback.
      AI_SERVICE_URL: "http://127.0.0.1:9",
      AI_SERVICE_TIMEOUT_MS: "500",
      PHONE_LOGIN_ENABLED: "true",
      GOOGLE_CLIENT_ID: "test-client.apps.googleusercontent.com",
      ADMIN_API_KEY: "test-admin-key-0123456789",
      BILLING_BKASH_NUMBER: "01700000000",
    },
  },
});
