import mongoose from "mongoose";

import { Customer } from "../model/Customer.js";
import { Otp } from "../model/Otp.js";
import { Session } from "../model/Session.js";
import { Transaction } from "../model/Transaction.js";
import { User } from "../model/User.js";
import { backfillLedgers } from "../services/ledger.service.js";
import { logger } from "../utils/logger.js";

export async function connectDatabase(uri: string) {
  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  logger.info("MongoDB connected");

  await prepareDatabase();
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

/**
 * Idempotent startup steps. Safe to run on every boot.
 */
export async function prepareDatabase() {
  // Customers created before soft-delete existed have no isArchived field.
  // The unique phone index only covers isArchived: false, so backfill first.
  const backfill = await Customer.updateMany(
    { isArchived: { $exists: false } },
    { $set: { isArchived: false } }
  );

  if (backfill.modifiedCount > 0) {
    logger.info(
      { count: backfill.modifiedCount },
      "Backfilled isArchived on customers"
    );
  }

  // Creates missing indexes and drops ones no longer in the schemas
  // (e.g. the old non-partial userId+phone unique index).
  for (const model of [User, Session, Otp, Customer, Transaction]) {
    await model.syncIndexes();
  }

  // Ledgers recorded before due dates existed.
  await backfillLedgers();
}
