"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { PortfolioHistoryPoint } from "@/lib/portfolioSnapshot";

const formatINR = (value: number) =>
  `₹${(value / 100000).toFixed(1)}L`;

const formatDateTick = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number | null; color: string; name: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p className="text-slate-400 mb-2 font-medium">{label ? formatDateTick(label) : ""}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="font-num font-bold text-white">
              {typeof entry.value === "number" ? formatINR(entry.value) : "—"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function PortfolioChart({ points }: { points: PortfolioHistoryPoint[] }) {
  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Portfolio Performance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Value history vs Nifty 50
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-500 rounded-full inline-block" />
            <span className="text-slate-400">Portfolio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-500 rounded-full inline-block" />
            <span className="text-slate-400">Nifty 50</span>
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="text-xs text-slate-500 py-8 text-center">
          No portfolio history yet — check back tomorrow to start seeing your value trend.
        </p>
      ) : (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={points}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="niftyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748B" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#64748B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateTick}
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatINR}
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="portfolio"
            name="Portfolio"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#portfolioGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="nifty"
            name="Nifty 50"
            stroke="#64748B"
            strokeWidth={1.5}
            fill="url(#niftyGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#64748B", stroke: "#fff", strokeWidth: 2 }}
            strokeDasharray="4 2"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
