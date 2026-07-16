import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DocumentModel } from "./Document";

describe("Document schema validation", () => {
  it("requires userId, name, type, and sizeBytes", async () => {
    const doc = new DocumentModel({});
    const err = await doc.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.userId).toBeDefined();
    expect(err?.errors.name).toBeDefined();
    expect(err?.errors.type).toBeDefined();
    expect(err?.errors.sizeBytes).toBeDefined();
  });

  it("rejects a type outside the supported enum", async () => {
    const doc = new DocumentModel({
      userId: new mongoose.Types.ObjectId(),
      name: "report.docx",
      type: "DOCX",
      sizeBytes: 1000,
    });
    const err = await doc.validate().then(
      () => null,
      (e: any) => e
    );
    expect(err?.errors.type).toBeDefined();
  });

  it("defaults status to processing", () => {
    const doc = new DocumentModel({
      userId: new mongoose.Types.ObjectId(),
      name: "report.pdf",
      type: "PDF",
      sizeBytes: 1000,
    });
    expect(doc.status).toBe("processing");
  });

  it("passes validation with valid fields", async () => {
    const doc = new DocumentModel({
      userId: new mongoose.Types.ObjectId(),
      name: "report.pdf",
      type: "PDF",
      sizeBytes: 1000,
      status: "indexed",
      chunkCount: 12,
    });
    await expect(doc.validate()).resolves.toBeUndefined();
  });
});

describe("Document userId scoping (integration)", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("only returns documents belonging to the requested user", async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await DocumentModel.create({ userId: userA, name: "a.pdf", type: "PDF", sizeBytes: 100 });
    await DocumentModel.create({ userId: userB, name: "b.pdf", type: "PDF", sizeBytes: 200 });

    const userADocs = await DocumentModel.find({ userId: userA });
    expect(userADocs).toHaveLength(1);
    expect(userADocs[0].name).toBe("a.pdf");
  });
});
