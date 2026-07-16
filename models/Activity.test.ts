import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Activity } from "./Activity";

describe("Activity schema validation", () => {
  it("requires userId, type, and message", async () => {
    const activity = new Activity({});
    const err = await activity.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.userId).toBeDefined();
    expect(err?.errors.type).toBeDefined();
    expect(err?.errors.message).toBeDefined();
  });

  it("rejects a type outside the allowed enum", async () => {
    const activity = new Activity({
      userId: new mongoose.Types.ObjectId(),
      type: "unsupported",
      message: "Something happened",
    });
    const err = await activity.validate().then(
      () => null,
      (e: any) => e
    );
    expect(err?.errors.type).toBeDefined();
  });

  it("passes validation with valid fields", async () => {
    const activity = new Activity({
      userId: new mongoose.Types.ObjectId(),
      type: "trade",
      message: "Added 10 shares of TCS to your portfolio",
    });
    await expect(activity.validate()).resolves.toBeUndefined();
  });
});

describe("Activity userId scoping (integration)", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("only returns activity belonging to the requested user", async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await Activity.create({ userId: userA, type: "trade", message: "First" });
    await Activity.create({ userId: userA, type: "price", message: "Second" });
    await Activity.create({ userId: userB, type: "trade", message: "Someone else's activity" });

    const userAActivity = await Activity.find({ userId: userA });
    expect(userAActivity.map((a) => a.message).sort()).toEqual(["First", "Second"]);
  });
});
