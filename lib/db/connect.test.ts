import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let mongod: MongoMemoryServer;
const originalDatabaseUrl = process.env.DATABASE_URL;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
});

afterAll(async () => {
  await mongod.stop();
  process.env.DATABASE_URL = originalDatabaseUrl;
});

describe("connectToDatabase", () => {
  it("connects to MongoDB and reuses the cached connection on subsequent calls", async () => {
    process.env.DATABASE_URL = mongod.getUri();
    vi.resetModules();
    const { connectToDatabase } = await import("./connect");

    const first = await connectToDatabase();
    expect(first.connection.readyState).toBe(1);

    const second = await connectToDatabase();
    expect(second).toBe(first);

    await first.disconnect();
  });

  it("throws when DATABASE_URL is not set", async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    await expect(import("./connect")).rejects.toThrow("Missing DATABASE_URL environment variable");
  });
});
