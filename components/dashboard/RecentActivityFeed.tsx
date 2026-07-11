"use client";

import type { SerializedActivity } from "@/lib/activity";
import { ArrowUpDown, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig: Record<
  SerializedActivity["type"],
  { icon: React.ReactNode; color: string; bg: string }
> = {
  trade: {
    icon: <ArrowUpDown className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  price: {
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
};

export default function RecentActivityFeed({ activity }: { activity: SerializedActivity[] }) {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Recent Activity</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Live feed</span>
        </div>
      </div>

      {activity.length === 0 ? (
        <p className="text-xs text-slate-500 py-8 text-center">
          No activity yet — add a holding or refresh prices to see it here.
        </p>
      ) : (
      <div className="flex-1 space-y-3 overflow-y-auto">
        {activity.map((item, i) => {
          const config = typeConfig[item.type];
          return (
            <div
              key={item.id}
              className="flex gap-3 items-start"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  config.bg,
                  config.color
                )}
              >
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.message}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  {item.timestamp}
                </p>
              </div>

              {/* Connector line (not last) */}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
