import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken, verifyAuthToken } from "./auth";

describe("signAuthToken / verifyAuthToken", () => {
  it("round-trips a valid payload", () => {
    const token = signAuthToken({ sub: "user-1", email: "user@example.com" });
    const payload = verifyAuthToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user-1");
    expect(payload?.email).toBe("user@example.com");
  });

  it("returns null for a malformed token", () => {
    expect(verifyAuthToken("not-a-real-jwt")).toBeNull();
  });

  it("returns null for a token signed with the wrong secret", () => {
    const token = jwt.sign({ sub: "user-1", email: "user@example.com" }, "wrong-secret");
    expect(verifyAuthToken(token)).toBeNull();
  });

  it("returns null for an expired token", () => {
    const token = jwt.sign(
      { sub: "user-1", email: "user@example.com" },
      process.env.JWT_SECRET as string,
      { expiresIn: -10 } // already expired
    );
    expect(verifyAuthToken(token)).toBeNull();
  });

  it("returns null for a tampered token", () => {
    const token = signAuthToken({ sub: "user-1", email: "user@example.com" });
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(verifyAuthToken(tampered)).toBeNull();
  });
});

describe("authCookieOptions", () => {
  it("uses the expected cookie name and flags", () => {
    expect(AUTH_COOKIE_NAME).toBe("finsight_session");
    expect(authCookieOptions.httpOnly).toBe(true);
    expect(authCookieOptions.sameSite).toBe("lax");
    expect(authCookieOptions.path).toBe("/");
    expect(authCookieOptions.maxAge).toBe(60 * 60 * 24 * 7);
  });

  it("does not mark the cookie secure outside production", () => {
    // vitest.config.ts sets NODE_ENV=test for this run
    expect(authCookieOptions.secure).toBe(false);
  });
});
