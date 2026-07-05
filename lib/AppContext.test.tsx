// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

import { AppProvider, useApp } from "./AppContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  document.documentElement.className = "";
});

describe("AppProvider / useApp", () => {
  it("starts with userLoading true and no user", () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.userLoading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("loads the current user from /api/auth/me on mount", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: "1", name: "Ada", email: "ada@example.com" } }),
    }) as unknown as typeof fetch;

    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => expect(result.current.userLoading).toBe(false));
    expect(result.current.user).toEqual({ id: "1", name: "Ada", email: "ada@example.com" });
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
  });

  it("sets user to null when the /api/auth/me request fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error")) as unknown as typeof fetch;

    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => expect(result.current.userLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("sets user to null when /api/auth/me responds not-ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch;

    const { result } = renderHook(() => useApp(), { wrapper });

    await waitFor(() => expect(result.current.userLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("logout clears the user, calls /api/auth/logout, and navigates to /login", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: "1", name: "Ada", email: "ada@example.com" } }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) }) as unknown as typeof fetch;

    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(result.current.user).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("toggles the document element's dark/light class with darkMode", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: null }) }) as unknown as typeof fetch;

    const { result } = renderHook(() => useApp(), { wrapper });
    await waitFor(() => expect(result.current.userLoading).toBe(false));

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => result.current.setDarkMode(false));

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});
