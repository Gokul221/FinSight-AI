import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Watchlist", () => ({
  Watchlist: { find: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/marketData", () => ({
  getNseQuotes: vi.fn(),
}));

import { signAuthToken } from "@/lib/auth";
import { Watchlist } from "@/models/Watchlist";
import { getNseQuotes } from "@/lib/marketData";
import { GET, POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/watchlist", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function authedCookie(sub = "user-1") {
  const token = signAuthToken({ sub, email: "ada@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });
}

beforeEach(() => {
  vi.clearAllMocks();
  (getNseQuotes as any).mockResolvedValue(new Map());
});

describe("GET /api/watchlist", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(Watchlist.find).not.toHaveBeenCalled();
  });

  it("returns only the current user's watchlist items, serialized", async () => {
    authedCookie("user-1");
    (Watchlist.find as any).mockResolvedValue([
      {
        _id: { toString: () => "w1" },
        name: "Infosys",
        ticker: "INFY",
        targetPrice: 1600,
        currentPrice: 1550,
        direction: "above",
      },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(Watchlist.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(res.status).toBe(200);
    expect(json.items).toEqual([
      { id: "w1", name: "Infosys", ticker: "INFY", targetPrice: 1600, currentPrice: 1550, direction: "above" },
    ]);
  });
});

describe("POST /api/watchlist", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await POST(makeRequest({ ticker: "INFY" }));
    expect(res.status).toBe(401);
    expect(Watchlist.create).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    authedCookie();

    const res = await POST(makeRequest({ ticker: "INFY" }));
    expect(res.status).toBe(400);
    expect(Watchlist.create).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid direction", async () => {
    authedCookie();

    const res = await POST(
      makeRequest({ ticker: "INFY", name: "Infosys", targetPrice: 1600, direction: "sideways" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-positive target price", async () => {
    authedCookie();

    const res = await POST(
      makeRequest({ ticker: "INFY", name: "Infosys", targetPrice: 0, direction: "above" })
    );
    expect(res.status).toBe(400);
  });

  it("creates a watchlist item scoped to the authenticated user, using the live quote as the starting price", async () => {
    authedCookie("user-1");
    (getNseQuotes as any).mockResolvedValue(new Map([["INFY", 1550]]));
    (Watchlist.create as any).mockResolvedValue({
      _id: { toString: () => "w1" },
      name: "Infosys",
      ticker: "INFY",
      targetPrice: 1600,
      currentPrice: 1550,
      direction: "above",
    });

    const res = await POST(
      makeRequest({ ticker: "infy", name: "Infosys", targetPrice: 1600, direction: "above" })
    );
    const json = await res.json();

    expect(Watchlist.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", ticker: "INFY", currentPrice: 1550 })
    );
    expect(res.status).toBe(201);
    expect(json.item.id).toBe("w1");
  });

  it("falls back to the target price as the starting price when a live quote isn't available", async () => {
    authedCookie("user-1");
    (getNseQuotes as any).mockResolvedValue(new Map());
    (Watchlist.create as any).mockResolvedValue({
      _id: { toString: () => "w1" },
      name: "Infosys",
      ticker: "INFY",
      targetPrice: 1600,
      currentPrice: 1600,
      direction: "above",
    });

    await POST(makeRequest({ ticker: "INFY", name: "Infosys", targetPrice: 1600, direction: "above" }));

    expect(Watchlist.create).toHaveBeenCalledWith(expect.objectContaining({ currentPrice: 1600 }));
  });
});
