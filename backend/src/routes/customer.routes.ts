import { Router } from "express";

import {
  create,
  getAll,
  getOne,
  remove,
  update,
} from "../controllers/customer.controller.js";
import {
  createReminder,
  getReminders,
  rotateStatementLink,
} from "../controllers/collection.controller.js";
import { getOne as getRisk } from "../controllers/risk.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", create);
router.get("/", getAll);
router.get("/:id", getOne);
router.patch("/:id", update);
router.delete("/:id", remove);

router.get("/:id/reminders", getReminders);
router.post("/:id/reminders", createReminder);
router.post("/:id/statement-link", rotateStatementLink);
router.get("/:id/risk", getRisk);

export default router;
