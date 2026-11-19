import { Router } from "express";

import {
  create,
  getCustomerTransactionsController,
  getTransactionsController,
} from "../controllers/transaction.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", create);
router.get("/", getTransactionsController);
router.get("/customer/:customerId", getCustomerTransactionsController);

export default router;
