"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { performanceHistory } from "@/lib/mockData";

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="text-slate-400 mb-2 font-medium">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-slate-300">{entry.name}:</span>
            <span
              className={`font-num font-bold ${entry.value >= 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {entry.value >= 0 ? "+" : ""}
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function PerformanceChart() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">
          Monthly Returns
        </h3>
        <p className="text-[11px] text-slate-500">vs Nifty benchmarks</p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={performanceHistory}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          barGap={2}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="portfolio"
            name="Portfolio"
            fill="#6366F1"
            radius={[3, 3, 0, 0]}
            maxBarSize={16}
          />
          <Bar
            dataKey="nifty50"
            name="Nifty 50"
            fill="#64748B"
            radius={[3, 3, 0, 0]}
            maxBarSize={16}
          />
          <Bar
            dataKey="niftyNext50"
            name="Nifty Next 50"
            fill="#8B5CF6"
            radius={[3, 3, 0, 0]}
            maxBarSize={16}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-3 justify-center">
        {[
          { color: "#6366F1", label: "Portfolio" },
          { color: "#64748B", label: "Nifty 50" },
          { color: "#8B5CF6", label: "Nifty Next 50" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: item.color }}
            />
            <span className="text-[10px] text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
