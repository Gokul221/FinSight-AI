"use client";

import { marketMovers } from "@/lib/mockData";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Tiny inline sparkline SVG
function Sparkline({
  data,
  positive,
}: {
  data: number[];
  positive: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const color = positive ? "#10B981" : "#F43F5E";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

export default function MarketMoverCard() {
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Market Movers</h3>
        <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-white/[0.04] rounded-full">
          NSE Live
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-0 items-center text-[10px] text-slate-500 uppercase tracking-wider px-1 mb-2">
          <span>Stock</span>
          <span className="text-right">Price</span>
          <span className="text-right">Change</span>
          <span className="text-right">7D</span>
        </div>

        <div className="space-y-0.5">
          {marketMovers.map((stock) => {
            const positive = stock.changePercent > 0;
            return (
              <div
                key={stock.ticker}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-1 py-2.5 rounded-lg table-row-hover cursor-pointer"
              >
                {/* Name */}
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {stock.ticker}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {stock.name}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="text-xs font-num font-bold text-slate-200">
                    ₹{stock.price.toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Change */}
                <div className="text-right">
                  <div
                    className={cn(
                      "flex items-center justify-end gap-0.5 text-xs font-medium font-num",
                      positive ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {positive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {positive ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </div>

                {/* Sparkline */}
                <div className="flex justify-end">
                  <Sparkline data={stock.sparkline} positive={positive} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
