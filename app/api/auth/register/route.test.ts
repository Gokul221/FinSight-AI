import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/User", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

import { User } from "@/models/User";
import { POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("returns 400 when name, email, or password is missing", async () => {
    const res = await POST(makeRequest({ email: "ada@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-JSON body instead of throwing", async () => {
    const res = await POST(new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: "not-json",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid email", async () => {
    const res = await POST(
      makeRequest({ name: "Ada", email: "not-an-email", password: "longenough" })
    );
    expect(res.status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("returns 400 for a password under 8 characters", async () => {
    const res = await POST(
      makeRequest({ name: "Ada", email: "ada@example.com", password: "short" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 when the email is already registered", async () => {
    (User.findOne as any).mockResolvedValue({ _id: "existing-user" });

    const res = await POST(
      makeRequest({ name: "Ada", email: "ada@example.com", password: "longenough" })
    );

    expect(res.status).toBe(409);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("creates the user, sets the session cookie, and returns 201", async () => {
    (User.findOne as any).mockResolvedValue(null);
    (User.create as any).mockResolvedValue({
      _id: { toString: () => "user-1" },
      name: "Ada",
      email: "ada@example.com",
    });

    const res = await POST(
      makeRequest({ name: "Ada", email: "ADA@Example.com", password: "longenough" })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.user).toEqual({ id: "user-1", name: "Ada", email: "ada@example.com" });
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "ada@example.com", name: "Ada" })
    );
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "finsight_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true })
    );
  });
});
