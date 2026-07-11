import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Holding", () => ({
  Holding: { find: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/activity", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import { signAuthToken } from "@/lib/auth";
import { Holding } from "@/models/Holding";
import { logActivity } from "@/lib/activity";
import { GET, POST } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/portfolio", {
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
});

describe("GET /api/portfolio", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(Holding.find).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid session token", async () => {
    mockCookieStore.get.mockReturnValue({ value: "not-a-real-token" });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns only the current user's holdings, serialized", async () => {
    authedCookie("user-1");
    (Holding.find as any).mockResolvedValue([
      {
        _id: { toString: () => "h1" },
        name: "Tata Consultancy Services",
        ticker: "TCS",
        quantity: 10,
        avgBuyPrice: 3000,
        currentPrice: 3200,
        sector: "IT",
      },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(Holding.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(res.status).toBe(200);
    expect(json.holdings).toEqual([
      {
        id: "h1",
        name: "Tata Consultancy Services",
        ticker: "TCS",
        quantity: 10,
        avgBuyPrice: 3000,
        currentPrice: 3200,
        sector: "IT",
      },
    ]);
  });
});

describe("POST /api/portfolio", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await POST(makeRequest({ ticker: "TCS" }));
    expect(res.status).toBe(401);
    expect(Holding.create).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    authedCookie();

    const res = await POST(makeRequest({ ticker: "TCS" }));
    expect(res.status).toBe(400);
    expect(Holding.create).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-positive quantity", async () => {
    authedCookie();

    const res = await POST(
      makeRequest({ ticker: "TCS", name: "TCS", sector: "IT", quantity: 0, avgBuyPrice: 100 })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for a negative avgBuyPrice", async () => {
    authedCookie();

    const res = await POST(
      makeRequest({ ticker: "TCS", name: "TCS", sector: "IT", quantity: 10, avgBuyPrice: -5 })
    );
    expect(res.status).toBe(400);
  });

  it("creates a holding scoped to the authenticated user and defaults currentPrice to avgBuyPrice", async () => {
    authedCookie("user-1");
    (Holding.create as any).mockResolvedValue({
      _id: { toString: () => "h1" },
      name: "Tata Consultancy Services",
      ticker: "TCS",
      quantity: 10,
      avgBuyPrice: 3000,
      currentPrice: 3000,
      sector: "IT",
    });

    const res = await POST(
      makeRequest({ ticker: "tcs", name: "Tata Consultancy Services", sector: "IT", quantity: 10, avgBuyPrice: 3000 })
    );
    const json = await res.json();

    expect(Holding.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", ticker: "TCS", currentPrice: 3000 })
    );
    expect(logActivity).toHaveBeenCalledWith("user-1", "trade", expect.stringContaining("TCS"));
    expect(res.status).toBe(201);
    expect(json.holding.id).toBe("h1");
  });
});
