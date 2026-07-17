import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Insight", () => ({
  Insight: { deleteMany: vi.fn().mockResolvedValue(undefined), insertMany: vi.fn() },
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
import { POST } from "./route";

function authedCookie(sub = "user-1") {
  const token = signAuthToken({ sub, email: "ada@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });
}

beforeEach(() => {
  vi.clearAllMocks();
  (Holding.find as any).mockResolvedValue([]);
});

describe("POST /api/insights/refresh", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await POST();
    expect(res.status).toBe(401);
    expect(Holding.find).not.toHaveBeenCalled();
  });

  it("generates new insights and bulk-replaces the user's cached ones", async () => {
    authedCookie("user-1");
    (generateInsights as any).mockResolvedValue([{ text: "Diversify.", severity: "warning" }]);
    (Insight.insertMany as any).mockResolvedValue([
      { _id: { toString: () => "i2" }, text: "Diversify.", severity: "warning" },
    ]);

    const res = await POST();
    const json = await res.json();

    expect(Insight.deleteMany).toHaveBeenCalledWith({ userId: "user-1" });
    expect(Insight.insertMany).toHaveBeenCalledWith([
      { userId: "user-1", text: "Diversify.", severity: "warning" },
    ]);
    expect(json.insights).toEqual([{ id: "i2", text: "Diversify.", severity: "warning" }]);
  });

  it("returns a 502 and leaves cached insights untouched when generation fails", async () => {
    authedCookie("user-1");
    (generateInsights as any).mockRejectedValue(new Error("Gemini is down"));

    const res = await POST();
    const json = await res.json();

    expect(res.status).toBe(502);
    expect(json.error).toBeTruthy();
    expect(Insight.deleteMany).not.toHaveBeenCalled();
    expect(Insight.insertMany).not.toHaveBeenCalled();
  });
});
