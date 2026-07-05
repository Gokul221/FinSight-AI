import { describe, expect, it } from "vitest";
import { isValidEmail, isValidPassword } from "./validation";

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.example.co")).toBe(true);
  });

  it("rejects missing @ or domain", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user@example")).toBe(false);
  });

  it("rejects whitespace and empty strings", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
    expect(isValidEmail("user@ example.com")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("accepts strings of 8+ characters", () => {
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("a much longer password")).toBe(true);
  });

  it("rejects strings shorter than 8 characters", () => {
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("")).toBe(false);
  });

  it("rejects non-string input", () => {
    // @ts-expect-error - intentionally testing non-string input at the runtime boundary
    expect(isValidPassword(undefined)).toBe(false);
    // @ts-expect-error - intentionally testing non-string input at the runtime boundary
    expect(isValidPassword(12345678)).toBe(false);
  });
});
