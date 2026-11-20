import type { Response } from "express";

import { getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import { getDashboardStats } from "../services/dashboard.service.js";
import { getAgingReport } from "../services/ledger.service.js";

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

export async function getAgingController(req: AuthRequest, res: Response) {
  const report = await getAgingReport(getUserId(req));

  res.status(200).json({
    success: true,
    data: report,
  });
}
