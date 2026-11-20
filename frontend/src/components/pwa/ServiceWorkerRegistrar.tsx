"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production builds only. In development the service
 * worker would serve stale bundles and fight hot reloading.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.error("Service worker registration failed:", error));
  }, []);

  return null;
}
