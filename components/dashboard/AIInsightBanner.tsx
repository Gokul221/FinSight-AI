"use client";

import Link from "next/link";
import { aiInsights } from "@/lib/mockData";
import { Sparkles, ArrowRight, AlertTriangle, Info, Bell } from "lucide-react";
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

export default function AIInsightBanner() {
  return (
    <div className="glass-card h-full flex flex-col border-l-2 border-indigo-500">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">AI Insights</h3>
            <p className="text-[11px] text-slate-500">Generated today</p>
          </div>
          <span className="ml-auto text-[10px] badge-indigo px-2 py-0.5 rounded-full font-medium">
            {aiInsights.length} new
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {aiInsights.map((insight, i) => {
          const config = severityConfig[insight.severity as keyof typeof severityConfig];
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
        })}
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
