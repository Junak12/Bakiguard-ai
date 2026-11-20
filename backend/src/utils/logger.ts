import pino from "pino";

import { env } from "../config/env.js";

export const logger = pino({
  level: env.isTest ? "silent" : env.LOG_LEVEL,

  // Never write credentials or tokens to logs.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[redacted]",
  },

  ...(env.isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
        },
      }),
});
