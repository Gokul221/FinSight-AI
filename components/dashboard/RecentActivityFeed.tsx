"use client";

import { recentActivity, ActivityItem } from "@/lib/mockData";
import {
  ArrowUpDown,
  Sparkles,
  Bell,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig: Record<
  ActivityItem["type"],
  { icon: React.ReactNode; color: string; bg: string }
> = {
  trade: {
    icon: <ArrowUpDown className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  ai: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  alert: {
    icon: <Bell className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  document: {
    icon: <FileText className="w-3.5 h-3.5" />,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
  },
};

export default function RecentActivityFeed() {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Recent Activity</h3>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Live feed</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {recentActivity.map((item, i) => {
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
    </div>
  );
}
