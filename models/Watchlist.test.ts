import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Watchlist } from "./Watchlist";

describe("Watchlist schema validation", () => {
  it("requires userId, name, ticker, targetPrice, currentPrice, and direction", async () => {
    const item = new Watchlist({});
    const err = await item.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.userId).toBeDefined();
    expect(err?.errors.name).toBeDefined();
    expect(err?.errors.ticker).toBeDefined();
    expect(err?.errors.targetPrice).toBeDefined();
    expect(err?.errors.currentPrice).toBeDefined();
    expect(err?.errors.direction).toBeDefined();
  });

  it("rejects negative prices and an invalid direction", async () => {
    const item = new Watchlist({
      userId: new mongoose.Types.ObjectId(),
      name: "Infosys",
      ticker: "INFY",
      targetPrice: -10,
      currentPrice: -10,
      direction: "sideways",
    });
    const err = await item.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.targetPrice).toBeDefined();
    expect(err?.errors.currentPrice).toBeDefined();
    expect(err?.errors.direction).toBeDefined();
  });

  it("uppercases the ticker on assignment", () => {
    const item = new Watchlist({
      userId: new mongoose.Types.ObjectId(),
      name: "Infosys",
      ticker: "infy",
      targetPrice: 1600,
      currentPrice: 1550,
      direction: "above",
    });
    expect(item.ticker).toBe("INFY");
  });

  it("passes validation with valid fields", async () => {
    const item = new Watchlist({
      userId: new mongoose.Types.ObjectId(),
      name: "Infosys",
      ticker: "INFY",
      targetPrice: 1600,
      currentPrice: 1550,
      direction: "above",
    });
    await expect(item.validate()).resolves.toBeUndefined();
  });
});

describe("Watchlist userId scoping (integration)", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("only returns watchlist items belonging to the requested user", async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await Watchlist.create({
      userId: userA,
      name: "Infosys",
      ticker: "INFY",
      targetPrice: 1600,
      currentPrice: 1550,
      direction: "above",
    });
    await Watchlist.create({
      userId: userB,
      name: "Wipro",
      ticker: "WIPRO",
      targetPrice: 480,
      currentPrice: 471,
      direction: "below",
    });

    const userAItems = await Watchlist.find({ userId: userA });
    expect(userAItems).toHaveLength(1);
    expect(userAItems[0].ticker).toBe("INFY");
  });

  it("does not delete a watchlist item when the userId does not match", async () => {
    const owner = new mongoose.Types.ObjectId();
    const attacker = new mongoose.Types.ObjectId();

    const item = await Watchlist.create({
      userId: owner,
      name: "Infosys",
      ticker: "INFY",
      targetPrice: 1600,
      currentPrice: 1550,
      direction: "above",
    });

    const result = await Watchlist.findOneAndDelete({ _id: item._id, userId: attacker });
    expect(result).toBeNull();

    const stillExists = await Watchlist.findById(item._id);
    expect(stillExists).not.toBeNull();
  });
});
