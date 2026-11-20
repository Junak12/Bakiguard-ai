import mongoose from "mongoose";

import { Customer, newStatementToken } from "../model/Customer.js";
import { Membership, newInviteToken } from "../model/Membership.js";
import { Otp } from "../model/Otp.js";
import { Payment } from "../model/Payment.js";
import { Reminder } from "../model/Reminder.js";
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
  for (const model of [User, Session, Otp, Customer, Transaction, Reminder, Membership, Payment]) {
    await model.syncIndexes();
  }

  // Statement links for customers created before they existed.
  const withoutToken = await Customer.find({ statementToken: { $exists: false } }, { _id: 1 }).lean();

  if (withoutToken.length > 0) {
    await Customer.bulkWrite(
      withoutToken.map(({ _id }) => ({
        updateOne: {
          filter: { _id, statementToken: { $exists: false } },
          update: { $set: { statementToken: newStatementToken() } },
        },
      }))
    );
    logger.info({ count: withoutToken.length }, "Created statement links for existing customers");
  }

  // Pending staff invites created before invite links existed.
  const linkless = await Membership.find(
    { status: "invited", inviteToken: { $exists: false } },
    { _id: 1 }
  ).lean();

  for (const { _id } of linkless) {
    await Membership.updateOne({ _id }, { $set: { inviteToken: newInviteToken() } });
  }

  // Ledgers recorded before due dates existed.
  await backfillLedgers();
}
