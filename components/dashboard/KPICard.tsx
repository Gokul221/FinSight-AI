"use client";

import { useEffect, useRef, useState } from "react";
import { KPI } from "@/lib/mockData";
import {
  TrendingUp,
  BarChart3,
  Shield,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
};

const deltaIcons = {
  positive: <ArrowUpRight className="w-3.5 h-3.5" />,
  negative: <ArrowDownRight className="w-3.5 h-3.5" />,
  neutral: <Minus className="w-3.5 h-3.5" />,
};

const deltaColors = {
  positive: "text-emerald-400 bg-emerald-400/10",
  negative: "text-rose-400 bg-rose-400/10",
  neutral: "text-slate-400 bg-slate-400/10",
};

const iconColors = {
  positive: "text-emerald-400 bg-emerald-400/10",
  negative: "text-rose-400 bg-rose-400/10",
  neutral: "text-indigo-400 bg-indigo-400/10",
};

export default function KPICard({ kpi, index }: { kpi: KPI; index: number }) {
  const [displayed, setDisplayed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      ref={ref}
      className={cn(
        "glass-card p-5 hover-lift cursor-default",
        "transition-all duration-500",
        displayed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {kpi.label}
        </p>
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
            iconColors[kpi.deltaType]
          )}
        >
          {iconMap[kpi.icon]}
        </div>
      </div>

      <p className="text-2xl font-bold text-white font-num mb-2 leading-none">
        {kpi.value}
      </p>

      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            deltaColors[kpi.deltaType]
          )}
        >
          {deltaIcons[kpi.deltaType]}
          <span>{kpi.delta}</span>
        </div>
        {kpi.subtext && (
          <span className="text-[11px] text-slate-600">{kpi.subtext}</span>
        )}
      </div>
    </div>
  );
}
