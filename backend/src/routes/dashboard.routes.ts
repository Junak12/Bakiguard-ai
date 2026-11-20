import { Router } from "express";

import { getAgingController, getDashboardStatsController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/stats", authenticate, getDashboardStatsController);
router.get("/aging", authenticate, getAgingController);

export default router;
