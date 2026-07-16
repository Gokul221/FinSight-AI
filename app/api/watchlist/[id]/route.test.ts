import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Watchlist", () => ({
  Watchlist: { findOneAndUpdate: vi.fn(), findOneAndDelete: vi.fn() },
}));

import { signAuthToken } from "@/lib/auth";
import { Watchlist } from "@/models/Watchlist";
import { PATCH, DELETE } from "./route";

function makeRequest(method: string, body?: unknown) {
  return new Request("http://localhost/api/watchlist/w1", {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function ctx(id = "w1") {
  return { params: Promise.resolve({ id }) };
}

function authedCookie(sub = "user-1") {
  const token = signAuthToken({ sub, email: "ada@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/watchlist/[id]", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await PATCH(makeRequest("PATCH", { targetPrice: 1500 }), ctx());
    expect(res.status).toBe(401);
    expect(Watchlist.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid target price", async () => {
    authedCookie();

    const res = await PATCH(makeRequest("PATCH", { targetPrice: -1 }), ctx());
    expect(res.status).toBe(400);
    expect(Watchlist.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid direction", async () => {
    authedCookie();

    const res = await PATCH(makeRequest("PATCH", { direction: "sideways" }), ctx());
    expect(res.status).toBe(400);
    expect(Watchlist.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the item doesn't exist or isn't owned by the user", async () => {
    authedCookie("user-1");
    (Watchlist.findOneAndUpdate as any).mockResolvedValue(null);

    const res = await PATCH(makeRequest("PATCH", { targetPrice: 1500 }), ctx());

    expect(Watchlist.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "w1", userId: "user-1" },
      { $set: { targetPrice: 1500 } },
      { new: true }
    );
    expect(res.status).toBe(404);
  });

  it("updates and returns the item when found", async () => {
    authedCookie("user-1");
    (Watchlist.findOneAndUpdate as any).mockResolvedValue({
      _id: { toString: () => "w1" },
      name: "Infosys",
      ticker: "INFY",
      targetPrice: 1500,
      currentPrice: 1550,
      direction: "below",
    });

    const res = await PATCH(makeRequest("PATCH", { targetPrice: 1500, direction: "below" }), ctx());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.item.targetPrice).toBe(1500);
    expect(json.item.direction).toBe("below");
  });
});

describe("DELETE /api/watchlist/[id]", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await DELETE(makeRequest("DELETE"), ctx());
    expect(res.status).toBe(401);
    expect(Watchlist.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("scopes the delete to the authenticated user and returns 404 if not found", async () => {
    authedCookie("user-1");
    (Watchlist.findOneAndDelete as any).mockResolvedValue(null);

    const res = await DELETE(makeRequest("DELETE"), ctx());

    expect(Watchlist.findOneAndDelete).toHaveBeenCalledWith({ _id: "w1", userId: "user-1" });
    expect(res.status).toBe(404);
  });

  it("returns success when the item is deleted", async () => {
    authedCookie("user-1");
    (Watchlist.findOneAndDelete as any).mockResolvedValue({
      _id: { toString: () => "w1" },
      ticker: "INFY",
    });

    const res = await DELETE(makeRequest("DELETE"), ctx());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });
});
