import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/logout", () => {
  it("deletes the session cookie and returns success", async () => {
    const res = await POST();
    const json = await res.json();

    expect(json).toEqual({ success: true });
    expect(mockCookieStore.delete).toHaveBeenCalledWith("finsight_session");
  });
});
