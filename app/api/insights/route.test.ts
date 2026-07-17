import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

const mockSort = vi.fn();
vi.mock("@/models/Insight", () => ({
  Insight: { find: vi.fn(() => ({ sort: mockSort })), insertMany: vi.fn() },
}));

vi.mock("@/models/Holding", () => ({
  Holding: { find: vi.fn() },
}));

vi.mock("@/lib/llm", () => ({
  generateInsights: vi.fn(),
}));

import { signAuthToken } from "@/lib/auth";
import { Insight } from "@/models/Insight";
import { Holding } from "@/models/Holding";
import { generateInsights } from "@/lib/llm";
import { GET } from "./route";

function authedCookie(sub = "user-1") {
  const token = signAuthToken({ sub, email: "ada@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });
}

beforeEach(() => {
  vi.clearAllMocks();
  (Holding.find as any).mockResolvedValue([]);
});

describe("GET /api/insights", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(Insight.find).not.toHaveBeenCalled();
  });

  it("returns cached insights, newest first, without generating new ones", async () => {
    authedCookie("user-1");
    mockSort.mockResolvedValue([
      { _id: { toString: () => "i1" }, text: "TCS is up.", severity: "info" },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(Insight.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(generateInsights).not.toHaveBeenCalled();
    expect(json.insights).toEqual([{ id: "i1", text: "TCS is up.", severity: "info" }]);
  });

  it("bootstraps insights via Gemini on a brand-new account with zero cached insights", async () => {
    authedCookie("user-1");
    mockSort.mockResolvedValue([]);
    (generateInsights as any).mockResolvedValue([{ text: "Diversify.", severity: "warning" }]);
    (Insight.insertMany as any).mockResolvedValue([
      { _id: { toString: () => "i1" }, text: "Diversify.", severity: "warning" },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(generateInsights).toHaveBeenCalled();
    expect(Insight.insertMany).toHaveBeenCalledWith([
      { userId: "user-1", text: "Diversify.", severity: "warning" },
    ]);
    expect(json.insights).toEqual([{ id: "i1", text: "Diversify.", severity: "warning" }]);
  });

  it("returns an empty array (not a 500) when the bootstrap generation fails", async () => {
    authedCookie("user-1");
    mockSort.mockResolvedValue([]);
    (generateInsights as any).mockRejectedValue(new Error("Gemini is down"));

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.insights).toEqual([]);
    expect(Insight.insertMany).not.toHaveBeenCalled();
  });
});
