import { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service";

export async function getDashboardStatsController(
  _req: Request,
  res: Response
) {
  try {
    const stats = await getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
}