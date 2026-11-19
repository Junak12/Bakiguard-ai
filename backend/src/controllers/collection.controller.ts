import type { Request, Response } from "express";
import { z } from "zod";

import { REMINDER_CHANNELS } from "../model/Reminder.js";
import { getUserId, type AuthRequest } from "../middleware/auth.middleware.js";
import { getCollectionList } from "../services/collection.service.js";
import { listReminders, logReminder, rotateStatementToken } from "../services/reminder.service.js";
import { getPublicStatement } from "../services/statement.service.js";
import { idParamSchema } from "../validators/common.validator.js";

const collectionQuerySchema = z.object({
  /** Include customers whose Baki falls due within this many days. */
  days: z.coerce.number().int().min(0).max(30).default(3),
});

const reminderSchema = z.object({
  channel: z.enum(REMINDER_CHANNELS),
});

// 24 random bytes, base64url.
const tokenParamSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{32}$/, "Invalid link"),
});

export async function getCollections(req: AuthRequest, res: Response) {
  const { days } = collectionQuerySchema.parse(req.query);

  const result = await getCollectionList(getUserId(req), days);

  res.status(200).json({ success: true, data: result.items, summary: result.summary });
}

export async function createReminder(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);
  const { channel } = reminderSchema.parse(req.body);

  const reminder = await logReminder(getUserId(req), id, channel);

  res.status(201).json({ success: true, data: reminder });
}

export async function getReminders(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const reminders = await listReminders(getUserId(req), id);

  res.status(200).json({ success: true, data: reminders });
}

export async function rotateStatementLink(req: AuthRequest, res: Response) {
  const { id } = idParamSchema.parse(req.params);

  const result = await rotateStatementToken(getUserId(req), id);

  res.status(200).json({ success: true, data: result });
}

/** Public: the customer opens this from a reminder. No login. */
export async function getStatement(req: Request, res: Response) {
  const { token } = tokenParamSchema.parse(req.params);

  // Personal financial data: never cache, never index.
  res.set("Cache-Control", "no-store");
  res.set("X-Robots-Tag", "noindex, nofollow");

  const statement = await getPublicStatement(token);

  res.status(200).json({ success: true, data: statement });
}
