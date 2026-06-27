"use client";

import { watchlistStocks } from "@/lib/mockData";
import { Bell, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function WatchlistTable() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Watchlist</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Stock
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Stock", "Target Price", "Current Price", "Gap", "Alert Type", "Status"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500 font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {watchlistStocks.map((stock) => {
              const gap = stock.currentPrice - stock.targetPrice;
              const gapPercent = ((gap / stock.targetPrice) * 100).toFixed(1);
              const positive = gap >= 0;
              const triggered = stock.status === "triggered";

              return (
                <tr
                  key={stock.id}
                  className="border-b border-white/[0.03] table-row-hover transition-colors"
                >
                  {/* Stock */}
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-200">{stock.ticker}</p>
                    <p className="text-[10px] text-slate-500">{stock.name}</p>
                  </td>

                  {/* Target */}
                  <td className="px-4 py-3 text-xs font-num text-slate-300">
                    ₹{stock.targetPrice.toLocaleString("en-IN")}
                  </td>

                  {/* Current */}
                  <td className="px-4 py-3 text-xs font-num font-bold text-slate-100">
                    ₹{stock.currentPrice.toLocaleString("en-IN")}
                  </td>

                  {/* Gap */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs font-num font-medium",
                        positive ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      {positive ? "+" : ""}
                      {gapPercent}%
                    </span>
                  </td>

                  {/* Alert Type */}
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {stock.alertType}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {triggered ? (
                      <span className="inline-flex items-center gap-1 badge-emerald px-2 py-0.5 rounded-full text-[10px] font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Triggered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 badge-indigo px-2 py-0.5 rounded-full text-[10px] font-medium">
                        <Bell className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
