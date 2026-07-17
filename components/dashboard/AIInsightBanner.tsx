"use client";

import { useState } from "react";
import Link from "next/link";
import type { SerializedInsight } from "@/lib/insights";
import { Sparkles, ArrowRight, AlertTriangle, Info, Bell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const severityConfig = {
  warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    dot: "bg-amber-400",
  },
  info: {
    icon: <Info className="w-3.5 h-3.5 text-indigo-400" />,
    dot: "bg-indigo-400",
  },
  alert: {
    icon: <Bell className="w-3.5 h-3.5 text-rose-400" />,
    dot: "bg-rose-400",
  },
};

export default function AIInsightBanner({
  insights,
  onRefresh,
}: {
  insights: SerializedInsight[];
  onRefresh: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await onRefresh();
    } catch {
      setRefreshError("Couldn't generate new insights. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="glass-card h-full flex flex-col border-l-2 border-indigo-500">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">AI Insights</h3>
            <p className="text-[11px] text-slate-500">Generated for your portfolio</p>
          </div>
          <span className="ml-auto text-[10px] badge-indigo px-2 py-0.5 rounded-full font-medium">
            {insights.length} new
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh insights"
            className="text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {refreshError && (
        <p className="px-4 pt-3 text-[11px] text-rose-400">{refreshError}</p>
      )}

      <div className="flex-1 overflow-y-auto">
        {insights.length === 0 ? (
          <p className="text-xs text-slate-500 py-8 text-center px-4">
            No insights yet — add holdings or refresh to generate AI insights for your portfolio.
          </p>
        ) : (
        insights.map((insight) => {
          const config = severityConfig[insight.severity];
          return (
            <div
              key={insight.id}
              className={cn(
                "p-4 border-b border-white/[0.04] last:border-0",
                "hover:bg-white/[0.02] transition-colors"
              )}
            >
              <div className="flex gap-2.5">
                <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {insight.text}
                  </p>
                  <Link
                    href="/chat"
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Ask AI
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      <div className="p-3 border-t border-white/[0.06]">
        <Link
          href="/chat"
          className="flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors py-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          View all insights
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
