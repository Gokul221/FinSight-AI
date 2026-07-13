import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Holding", () => ({
  Holding: { findOneAndUpdate: vi.fn(), findOneAndDelete: vi.fn(), distinct: vi.fn() },
}));

vi.mock("@/lib/activity", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import { signAuthToken } from "@/lib/auth";
import { Holding } from "@/models/Holding";
import { logActivity } from "@/lib/activity";
import { PATCH, DELETE } from "./route";

function makeRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/portfolio/h1", {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function ctx(id = "h1") {
  return { params: Promise.resolve({ id }) };
}

function authedCookie(sub = "user-1") {
  const token = signAuthToken({ sub, email: "ada@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });
}

beforeEach(() => {
  vi.clearAllMocks();
  (Holding.distinct as any).mockResolvedValue([]);
});

describe("PATCH /api/portfolio/[id]", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await PATCH(makeRequest("PATCH", { quantity: 5 }), ctx());
    expect(res.status).toBe(401);
    expect(Holding.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid quantity", async () => {
    authedCookie();

    const res = await PATCH(makeRequest("PATCH", { quantity: -1 }), ctx());
    expect(res.status).toBe(400);
    expect(Holding.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the holding doesn't exist or isn't owned by the user", async () => {
    authedCookie("user-1");
    (Holding.findOneAndUpdate as any).mockResolvedValue(null);

    const res = await PATCH(makeRequest("PATCH", { quantity: 5 }), ctx());

    expect(Holding.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "h1", userId: "user-1" },
      { $set: { quantity: 5 } },
      { new: true }
    );
    expect(res.status).toBe(404);
  });

  it("updates and returns the holding when found", async () => {
    authedCookie("user-1");
    (Holding.findOneAndUpdate as any).mockResolvedValue({
      _id: { toString: () => "h1" },
      name: "Tata Consultancy Services",
      ticker: "TCS",
      quantity: 15,
      avgBuyPrice: 3000,
      currentPrice: 3200,
      sector: "IT",
    });

    const res = await PATCH(makeRequest("PATCH", { quantity: 15 }), ctx());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.holding.quantity).toBe(15);
    expect(logActivity).toHaveBeenCalledWith("user-1", "trade", expect.stringContaining("TCS"));
  });

  it("reuses the existing sector's casing instead of creating a case-variant duplicate", async () => {
    authedCookie("user-1");
    (Holding.distinct as any).mockResolvedValue(["Banking"]);
    (Holding.findOneAndUpdate as any).mockResolvedValue({
      _id: { toString: () => "h1" },
      name: "HDFC Bank",
      ticker: "HDFCBANK",
      quantity: 10,
      avgBuyPrice: 1500,
      currentPrice: 1600,
      sector: "Banking",
    });

    await PATCH(makeRequest("PATCH", { sector: "banking" }), ctx());

    expect(Holding.distinct).toHaveBeenCalledWith("sector", { userId: "user-1" });
    expect(Holding.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "h1", userId: "user-1" },
      { $set: { sector: "Banking" } },
      { new: true }
    );
  });
});

describe("DELETE /api/portfolio/[id]", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await DELETE(makeRequest("DELETE"), ctx());
    expect(res.status).toBe(401);
    expect(Holding.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("scopes the delete to the authenticated user and returns 404 if not found", async () => {
    authedCookie("user-1");
    (Holding.findOneAndDelete as any).mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE"), ctx());

    expect(Holding.findOneAndDelete).toHaveBeenCalledWith({ _id: "h1", userId: "user-1" });
    expect(res.status).toBe(404);
  });

  it("returns success when the holding is deleted", async () => {
    authedCookie("user-1");
    (Holding.findOneAndDelete as any).mockResolvedValue({
      _id: { toString: () => "h1" },
      ticker: "TCS",
    });

    const res = await DELETE(makeRequest("DELETE"), ctx());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(logActivity).toHaveBeenCalledWith("user-1", "trade", expect.stringContaining("TCS"));
  });
});
