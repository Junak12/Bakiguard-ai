import { Router } from "express";

import { getStatement } from "../controllers/collection.controller.js";
import { publicLimiter } from "../middleware/rateLimit.middleware.js";

/** Endpoints that need no login. Keep this list short. */
const router = Router();

router.get("/statements/:token", publicLimiter, getStatement);

export default router;
