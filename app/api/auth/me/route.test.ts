import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/User", () => ({
  User: { findById: vi.fn() },
}));

import { signAuthToken } from "@/lib/auth";
import { User } from "@/models/User";
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/me", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 when the session token is invalid", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not-a-real-token" });

    const res = await GET();
    expect(res.status).toBe(401);
    expect(User.findById).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is valid but the user no longer exists", async () => {
    const token = signAuthToken({ sub: "user-1", email: "ada@example.com" });
    mockCookieStore.get.mockReturnValue({ value: token });
    (User.findById as any).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with the user for a valid session", async () => {
    const token = signAuthToken({ sub: "user-1", email: "ada@example.com" });
    mockCookieStore.get.mockReturnValue({ value: token });
    (User.findById as any).mockResolvedValue({
      _id: { toString: () => "user-1" },
      name: "Ada",
      email: "ada@example.com",
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.user).toEqual({ id: "user-1", name: "Ada", email: "ada@example.com" });
  });
});
