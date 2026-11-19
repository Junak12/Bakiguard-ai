import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

import { connectDatabase, disconnectDatabase } from "../src/config/database.js";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  // A replica set (not a standalone server) so multi-document transactions work,
  // exactly like MongoDB Atlas in production.
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDatabase(replSet.getUri());
});

afterEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await disconnectDatabase();
  await replSet?.stop();
});
