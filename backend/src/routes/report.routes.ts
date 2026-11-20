import { Router } from "express";

import { exportMonth, monthly } from "../controllers/report.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, requireRole("owner", "manager"));

router.get("/monthly", monthly);
router.get("/monthly/export", exportMonth);

export default router;
