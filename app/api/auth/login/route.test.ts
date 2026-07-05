import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/User", () => ({
  User: { findOne: vi.fn() },
}));

import { User } from "@/models/User";
import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function mockFindOneResult(user: unknown) {
  (User.findOne as any).mockReturnValue({ select: vi.fn().mockResolvedValue(user) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("returns 400 when email or password is missing", async () => {
    const res = await POST(makeRequest({ email: "ada@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-JSON body instead of throwing", async () => {
    const res = await POST(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: "not-json",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when no user matches the email", async () => {
    mockFindOneResult(null);

    const res = await POST(makeRequest({ email: "ada@example.com", password: "longenough" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when the password doesn't match", async () => {
    mockFindOneResult({
      _id: { toString: () => "user-1" },
      email: "ada@example.com",
      comparePassword: vi.fn().mockResolvedValue(false),
    });

    const res = await POST(makeRequest({ email: "ada@example.com", password: "wrong-password" }));
    expect(res.status).toBe(401);
  });

  it("returns 200, the user, and sets the session cookie on success", async () => {
    mockFindOneResult({
      _id: { toString: () => "user-1" },
      name: "Ada",
      email: "ada@example.com",
      comparePassword: vi.fn().mockResolvedValue(true),
    });

    const res = await POST(makeRequest({ email: "ada@example.com", password: "correct-horse" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user).toEqual({ id: "user-1", name: "Ada", email: "ada@example.com" });
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "finsight_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true })
    );
  });
});
