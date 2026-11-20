import type { Response } from "express";
import { z } from "zod";

import { getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import { assertReportExport } from "../services/billing.service.js";
import { buildMonthCsv, currentMonth, getMonthlyReport } from "../services/report.service.js";

const monthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must look like 2026-11")
    .optional(),
});

export async function monthly(req: AuthRequest, res: Response) {
  const { month = currentMonth() } = monthQuerySchema.parse(req.query);

  const report = await getMonthlyReport(getUserId(req), month);

  res.status(200).json({ success: true, data: report });
}

export async function exportMonth(req: AuthRequest, res: Response) {
  const { month = currentMonth() } = monthQuerySchema.parse(req.query);

  await assertReportExport(getUserId(req));

  const csv = await buildMonthCsv(getUserId(req), month);

  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", `attachment; filename="bakiguard-${month}.csv"`);
  res.set("Cache-Control", "no-store");
  res.status(200).send(csv);
}
