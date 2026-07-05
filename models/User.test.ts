import bcrypt from "bcryptjs";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { User, type UserDocument } from "./User";

// These tests exercise schema validation and instance methods directly,
// without opening a real MongoDB connection (validateSync / methods don't
// need one — only .save()/.find() etc. do). The password-hashing pre("save")
// hook itself isn't covered here since it only fires on .save(); that needs
// an integration test against a real/in-memory MongoDB.

describe("User schema validation", () => {
  it("requires name, email, and password", async () => {
    const user = new User({});
    const err = await user.validate().then(
      () => null,
      (e: any) => e
    );

    expect(err?.errors.name).toBeDefined();
    expect(err?.errors.email).toBeDefined();
    expect(err?.errors.password).toBeDefined();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const user = new User({ name: "Ada", email: "ada@example.com", password: "short" });
    const err = await user.validate().then(
      () => null,
      (e: any) => e
    );
    expect(err?.errors.password).toBeDefined();
  });

  it("passes validation with valid fields", async () => {
    const user = new User({ name: "Ada", email: "ada@example.com", password: "longenough" });
    await expect(user.validate()).resolves.toBeUndefined();
  });

  it("trims and lowercases email on assignment", () => {
    const user = new User({
      name: "Ada",
      email: "  ADA@Example.COM  ",
      password: "longenough",
    });
    expect(user.email).toBe("ada@example.com");
  });

  it("trims the name field", () => {
    const user = new User({ name: "  Ada Lovelace  ", email: "ada@example.com", password: "longenough" });
    expect(user.name).toBe("Ada Lovelace");
  });
});

describe("User.comparePassword", () => {
  it("resolves true for the correct password", async () => {
    const hashed = await bcrypt.hash("correct-horse", 12);
    const user = new User({ name: "Ada", email: "ada@example.com", password: hashed }) as UserDocument;

    await expect(user.comparePassword("correct-horse")).resolves.toBe(true);
  });

  it("resolves false for an incorrect password", async () => {
    const hashed = await bcrypt.hash("correct-horse", 12);
    const user = new User({ name: "Ada", email: "ada@example.com", password: hashed }) as UserDocument;

    await expect(user.comparePassword("wrong-password")).resolves.toBe(false);
  });
});

describe("password hashing on save (integration)", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("hashes the password on save and leaves it comparable via comparePassword", async () => {
    const user = await User.create({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
    });

    const stored = (await User.findById(user._id).select("+password")) as UserDocument;

    expect(stored.password).not.toBe("correct-horse");
    await expect(stored.comparePassword("correct-horse")).resolves.toBe(true);
  });

  it("does not re-hash the password when saving unrelated field changes", async () => {
    const user = await User.create({
      name: "Ada Lovelace",
      email: "grace@example.com",
      password: "correct-horse",
    });
    const firstHash = (await User.findById(user._id).select("+password"))!.password;

    user.name = "Grace Hopper";
    await user.save();

    const secondHash = (await User.findById(user._id).select("+password"))!.password;
    expect(secondHash).toBe(firstHash);
  });
});
