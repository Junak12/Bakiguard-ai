import type { Response } from "express";

import { getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import { getCustomerRisk, getRiskOverview } from "../services/risk.service.js";
import { idParamSchema } from "../validators/common.validator.js";

export async function getOverview(req: AuthRequest, res: Response) {
  const result = await getRiskOverview(getUserId(req));

  res.status(200).json({ success: true, data: result.items, summary: result.summary });
}

export async function getOne(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const result = await getCustomerRisk(getUserId(req), id);

  res.status(200).json({ success: true, data: result });
}
