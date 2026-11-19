import { Router } from "express";



import {
  create,
  getCustomerTransactionsController,
} from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth.middleware";


const router = Router();

router.post(
  "/",
  authenticate,
  create
);

router.get(
  "/customer/:customerId",
  authenticate,
  getCustomerTransactionsController
);

export default router;