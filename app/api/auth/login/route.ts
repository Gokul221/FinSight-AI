import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { User, type UserDocument } from "@/models/User";
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  await connectToDatabase();

  const user = (await User.findOne({ email }).select("+password")) as UserDocument | null;
  const passwordMatches = user ? await user.comparePassword(password) : false;

  if (!user || !passwordMatches) {
    return Response.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = signAuthToken({ sub: user._id.toString(), email: user.email });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, authCookieOptions);

  return Response.json({
    user: { id: user._id.toString(), name: user.name, email: user.email },
  });
}
