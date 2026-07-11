import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

const mockLimit = vi.fn();
const mockSort = vi.fn(() => ({ limit: mockLimit }));
vi.mock("@/models/Activity", () => ({
  Activity: { find: vi.fn(() => ({ sort: mockSort })) },
}));

import { getAuthenticatedUserId } from "@/lib/session";
import { Activity } from "@/models/Activity";
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mockSort.mockReturnValue({ limit: mockLimit });
});

describe("GET /api/activity", () => {
  it("returns 401 when there is no session", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(Activity.find).not.toHaveBeenCalled();
  });

  it("returns the current user's activity, sorted newest-first and capped at 10", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    mockLimit.mockResolvedValue([
      {
        _id: { toString: () => "a1" },
        type: "trade",
        message: "Added 10 shares of TCS to your portfolio",
        createdAt: new Date(),
      },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(Activity.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(res.status).toBe(200);
    expect(json.activity).toEqual([
      {
        id: "a1",
        type: "trade",
        message: "Added 10 shares of TCS to your portfolio",
        timestamp: expect.any(String),
      },
    ]);
  });
});
