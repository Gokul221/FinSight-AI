import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { User, type UserDocument } from "@/models/User";
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken } from "@/lib/auth";
import { isValidEmail, isValidPassword } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name || !email || !password) {
    return Response.json({ error: "Name, email, and password are required." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  await connectToDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const user = (await User.create({ name, email, password })) as UserDocument;
  const token = signAuthToken({ sub: user._id.toString(), email: user.email });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, authCookieOptions);

  return Response.json(
    { user: { id: user._id.toString(), name: user.name, email: user.email } },
    { status: 201 }
  );
}
