import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";

import {
  create,
  getHistory,
  getBalance,
} from "../controllers/transaction.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", create);

router.get(
  "/customer/:customerId",
  getHistory
);

router.get(
  "/customer/:customerId/balance",
  getBalance
);

export default router;