import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Holding } from "./Holding";

describe("Holding schema validation", () => {
  it("requires userId, name, ticker, quantity, avgBuyPrice, currentPrice, and sector", async () => {
    const holding = new Holding({});
    const err = await holding.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.userId).toBeDefined();
    expect(err?.errors.name).toBeDefined();
    expect(err?.errors.ticker).toBeDefined();
    expect(err?.errors.quantity).toBeDefined();
    expect(err?.errors.avgBuyPrice).toBeDefined();
    expect(err?.errors.currentPrice).toBeDefined();
    expect(err?.errors.sector).toBeDefined();
  });

  it("rejects negative quantity/prices", async () => {
    const holding = new Holding({
      userId: new mongoose.Types.ObjectId(),
      name: "Tata Consultancy Services",
      ticker: "TCS",
      quantity: -1,
      avgBuyPrice: -10,
      currentPrice: -10,
      sector: "IT",
    });
    const err = await holding.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.quantity).toBeDefined();
    expect(err?.errors.avgBuyPrice).toBeDefined();
    expect(err?.errors.currentPrice).toBeDefined();
  });

  it("uppercases the ticker on assignment", () => {
    const holding = new Holding({
      userId: new mongoose.Types.ObjectId(),
      name: "Tata Consultancy Services",
      ticker: "tcs",
      quantity: 10,
      avgBuyPrice: 3000,
      currentPrice: 3200,
      sector: "IT",
    });
    expect(holding.ticker).toBe("TCS");
  });

  it("passes validation with valid fields", async () => {
    const holding = new Holding({
      userId: new mongoose.Types.ObjectId(),
      name: "Tata Consultancy Services",
      ticker: "TCS",
      quantity: 10,
      avgBuyPrice: 3000,
      currentPrice: 3200,
      sector: "IT",
    });
    await expect(holding.validate()).resolves.toBeUndefined();
  });
});

describe("Holding userId scoping (integration)", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("only returns holdings belonging to the requested user", async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();

    await Holding.create({
      userId: userA,
      name: "Tata Consultancy Services",
      ticker: "TCS",
      quantity: 10,
      avgBuyPrice: 3000,
      currentPrice: 3200,
      sector: "IT",
    });
    await Holding.create({
      userId: userB,
      name: "HDFC Bank",
      ticker: "HDFCBANK",
      quantity: 5,
      avgBuyPrice: 1500,
      currentPrice: 1600,
      sector: "Banking",
    });

    const userAHoldings = await Holding.find({ userId: userA });
    expect(userAHoldings).toHaveLength(1);
    expect(userAHoldings[0].ticker).toBe("TCS");
  });

  it("does not delete a holding when the userId does not match", async () => {
    const owner = new mongoose.Types.ObjectId();
    const attacker = new mongoose.Types.ObjectId();

    const holding = await Holding.create({
      userId: owner,
      name: "Infosys",
      ticker: "INFY",
      quantity: 20,
      avgBuyPrice: 1400,
      currentPrice: 1500,
      sector: "IT",
    });

    const result = await Holding.findOneAndDelete({ _id: holding._id, userId: attacker });
    expect(result).toBeNull();

    const stillExists = await Holding.findById(holding._id);
    expect(stillExists).not.toBeNull();
  });
});
