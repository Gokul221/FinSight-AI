// This is a Next.js API route that handles the GET request to retrieve the authenticated user's information. It checks for a valid authentication token in the cookies, verifies it, and fetches the user data from the database if the token is valid. If the token is invalid or the user is not found, it returns a 401 Unauthorized response.

import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { User, type UserDocument } from "@/models/User";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? verifyAuthToken(token) : null;

  if (!payload) {
    return Response.json({ user: null }, { status: 401 });
  }

  await connectToDatabase();
  const user = (await User.findById(payload.sub)) as UserDocument | null;

  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user: { id: user._id.toString(), name: user.name, email: user.email },
  });
}
