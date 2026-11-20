import { Router } from "express";

import { getOverview } from "../controllers/risk.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getOverview);

export default router;
