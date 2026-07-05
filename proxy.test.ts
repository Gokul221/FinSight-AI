import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { signAuthToken } from "@/lib/auth";
import { proxy } from "./proxy";

function makeRequest(pathname: string, token?: string) {
  const headers = new Headers();
  if (token) headers.set("cookie", `finsight_session=${token}`);
  return new NextRequest(`http://localhost${pathname}`, { headers });
}

const validToken = () => signAuthToken({ sub: "user-1", email: "user@example.com" });

describe("proxy", () => {
  it("redirects unauthenticated requests to protected paths to /login with a next param", () => {
    const res = proxy(makeRequest("/dashboard"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/dashboard");
  });

  it("lets unauthenticated requests through to public paths", () => {
    const res = proxy(makeRequest("/login"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets authenticated requests through to protected paths", () => {
    const res = proxy(makeRequest("/dashboard", validToken()));
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects authenticated requests away from /login to /dashboard", () => {
    const res = proxy(makeRequest("/login", validToken()));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/dashboard");
  });

  it("treats a garbage session cookie as unauthenticated", () => {
    const res = proxy(makeRequest("/dashboard", "not-a-real-token"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });
});
