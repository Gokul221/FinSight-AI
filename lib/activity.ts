import { connectToDatabase } from "@/lib/db/connect";
import { Activity } from "@/models/Activity";

export type ActivityType = "trade" | "price";

export async function logActivity(userId: string, type: ActivityType, message: string): Promise<void> {
  await connectToDatabase();
  await Activity.create({ userId, type, message });
}

export interface SerializedActivity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
}

interface SerializableActivityDocument {
  _id: { toString(): string };
  type: string;
  message: string;
  createdAt: Date;
}

export function formatActivityTimestamp(date: Date, now: Date = new Date()): string {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  if (dayDiff <= 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  if (dayDiff < 7) return `${dayDiff} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function serializeActivity(activity: SerializableActivityDocument): SerializedActivity {
  return {
    id: activity._id.toString(),
    type: activity.type as ActivityType,
    message: activity.message,
    timestamp: formatActivityTimestamp(activity.createdAt),
  };
}
