import type { Response } from "express";

import { getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import { getDashboardStats } from "../services/dashboard.service.js";

export async function getDashboardStatsController(
  req: AuthRequest,
  res: Response
) {
  const stats = await getDashboardStats(getUserId(req));

  res.status(200).json({
    success: true,
    data: stats,
  });
}
