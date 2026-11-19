import { Router } from "express";

import { getDashboardAIInsightsController } from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/dashboard-insights", authenticate, getDashboardAIInsightsController);

export default router;
