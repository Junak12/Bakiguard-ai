import type { Response } from "express";

import { getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import { getDashboardAIInsights } from "../services/ai.service.js";

export async function getDashboardAIInsightsController(
  req: AuthRequest,
  res: Response
) {
  const insights = await getDashboardAIInsights(getUserId(req));

  res.status(200).json({
    success: true,
    data: insights,
  });
}
