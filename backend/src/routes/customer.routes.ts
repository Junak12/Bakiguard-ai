import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/customer.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", create);

router.get("/", getAll);

router.get("/:id", getOne);

router.patch("/:id", update);

router.delete("/:id", remove);

export default router;