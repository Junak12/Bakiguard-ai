import { Router } from "express";

import { getCollections } from "../controllers/collection.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, getCollections);

export default router;
