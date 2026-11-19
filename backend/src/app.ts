import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { isDatabaseReady } from "./config/database.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import aiRoutes from "./routes/ai.routes.js";
import authRoutes from "./routes/auth.routes.js";
import collectionRoutes from "./routes/collection.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import publicRoutes from "./routes/public.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import { logger } from "./utils/logger.js";

const app = express();

// Needed for correct client IPs (rate limiting, sessions) behind a proxy.
app.set("trust proxy", env.TRUST_PROXY);
app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.use(
  pinoHttp({
    logger,
    // Health checks are polled constantly; keep them out of the logs.
    autoLogging: { ignore: (req) => req.url?.startsWith("/api/health") ?? false },
    // Log what's useful for debugging, not every header.
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

// Liveness: the process is up.
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "BakiGuard API is running" });
});

// Readiness: the process can serve traffic (database connected).
app.get("/api/health/ready", (_req, res) => {
  const ready = isDatabaseReady();

  res.status(ready ? 200 : 503).json({
    success: ready,
    database: ready ? "connected" : "disconnected",
  });
});

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/public", publicRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
