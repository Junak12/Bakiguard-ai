import { env } from "./config/env.js";

import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { logger } from "./utils/logger.js";

async function startServer() {
  try {
    await connectDatabase(env.MONGODB_URI);
  } catch (error) {
    logger.fatal({ err: error }, "Could not connect to MongoDB");
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`BakiGuard API running on port ${env.PORT}`);
  });

  // Finish in-flight requests before exiting (deploys, container restarts).
  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info(`${signal} received, shutting down`);

    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();

    server.close(async () => {
      await disconnectDatabase();
      logger.info("Shutdown complete");
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "Uncaught exception");
  process.exit(1);
});

void startServer();
