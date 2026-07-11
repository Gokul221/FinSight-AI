import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

// Reads and verifies the session cookie for the current request.
// Returns the user id (JWT `sub`), or null if there's no valid session.
export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? verifyAuthToken(token) : null;
  return payload?.sub ?? null;
}
