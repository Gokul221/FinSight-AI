import { connectToDatabase } from "@/lib/db/connect";
import { Activity } from "@/models/Activity";
import { serializeActivity } from "@/lib/activity";
import { getAuthenticatedUserId } from "@/lib/session";

const RECENT_ACTIVITY_LIMIT = 10;

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const items = await Activity.find({ userId })
    .sort({ createdAt: -1 })
    .limit(RECENT_ACTIVITY_LIMIT);

  return Response.json({ activity: items.map(serializeActivity) });
}
