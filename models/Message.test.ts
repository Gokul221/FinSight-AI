import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Message } from "./Message";

describe("Message schema validation", () => {
  it("requires userId, role, and content", async () => {
    const message = new Message({});
    const err = await message.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.userId).toBeDefined();
    expect(err?.errors.role).toBeDefined();
    expect(err?.errors.content).toBeDefined();
  });

  it("rejects a role outside user/assistant", async () => {
    const message = new Message({
      userId: new mongoose.Types.ObjectId(),
      role: "system",
      content: "hi",
    });
    const err = await message.validate().then(
      () => null,
      (e: any) => e
    );
    expect(err?.errors.role).toBeDefined();
  });

  it("defaults sources to an empty array", () => {
    const message = new Message({
      userId: new mongoose.Types.ObjectId(),
      role: "user",
      content: "hi",
    });
    expect(message.sources).toEqual([]);
  });

  it("passes validation with sources attached", async () => {
    const message = new Message({
      userId: new mongoose.Types.ObjectId(),
      role: "assistant",
      content: "Here's what I found.",
      sources: [
        {
          documentId: new mongoose.Types.ObjectId(),
          documentName: "report.pdf",
          excerpt: "TCS grew 10%.",
          relevanceScore: 87,
        },
      ],
    });
    await expect(message.validate()).resolves.toBeUndefined();
  });
});

describe("Message userId scoping (integration)", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("only returns messages belonging to the requested user", async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await Message.create({ userId: userA, role: "user", content: "hello from A" });
    await Message.create({ userId: userB, role: "user", content: "hello from B" });

    const userAMessages = await Message.find({ userId: userA });
    expect(userAMessages).toHaveLength(1);
    expect(userAMessages[0].content).toBe("hello from A");
  });
});
