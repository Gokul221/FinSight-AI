import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Chunk } from "./Chunk";

describe("Chunk schema validation", () => {
  it("requires userId, documentId, documentName, text, and order", async () => {
    const chunk = new Chunk({});
    const err = await chunk.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.userId).toBeDefined();
    expect(err?.errors.documentId).toBeDefined();
    expect(err?.errors.documentName).toBeDefined();
    expect(err?.errors.text).toBeDefined();
    expect(err?.errors.order).toBeDefined();
    // `embedding: [Number]` defaults to [] when omitted — mongoose doesn't
    // treat an empty array as missing for `required`, so it isn't asserted here.
  });

  it("passes validation with valid fields", async () => {
    const chunk = new Chunk({
      userId: new mongoose.Types.ObjectId(),
      documentId: new mongoose.Types.ObjectId(),
      documentName: "report.pdf",
      text: "Some extracted text.",
      embedding: [0.1, 0.2, 0.3],
      order: 0,
    });
    await expect(chunk.validate()).resolves.toBeUndefined();
  });
});

describe("Chunk userId scoping (integration)", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("only returns chunks belonging to the requested user", async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const docId = new mongoose.Types.ObjectId();

    await Chunk.create({
      userId: userA,
      documentId: docId,
      documentName: "a.pdf",
      text: "chunk a",
      embedding: [0.1],
      order: 0,
    });
    await Chunk.create({
      userId: userB,
      documentId: docId,
      documentName: "a.pdf",
      text: "chunk b",
      embedding: [0.2],
      order: 0,
    });

    const userAChunks = await Chunk.find({ userId: userA });
    expect(userAChunks).toHaveLength(1);
    expect(userAChunks[0].text).toBe("chunk a");
  });

  it("deletes only the chunks for the given document", async () => {
    const userId = new mongoose.Types.ObjectId();
    const docId1 = new mongoose.Types.ObjectId();
    const docId2 = new mongoose.Types.ObjectId();

    await Chunk.create({ userId, documentId: docId1, documentName: "a.pdf", text: "a", embedding: [0.1], order: 0 });
    await Chunk.create({ userId, documentId: docId2, documentName: "b.pdf", text: "b", embedding: [0.2], order: 0 });

    await Chunk.deleteMany({ documentId: docId1, userId });

    const remaining = await Chunk.find({ userId });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].documentName).toBe("b.pdf");
  });
});
