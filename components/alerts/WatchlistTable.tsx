"use client";

import { Bell, CheckCircle, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawWatchlistItem, WatchlistItem } from "@/lib/watchlist";
import AddWatchlistDialog from "./AddWatchlistDialog";

export default function WatchlistTable({
  items,
  onAdded,
  onDelete,
}: {
  items: WatchlistItem[];
  onAdded: (item: RawWatchlistItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Watchlist</h3>
        <AddWatchlistDialog onAdded={onAdded} />
      </div>

      {items.length === 0 ? (
        <div className="p-10 flex flex-col items-center justify-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-slate-500 mb-1">
            <Eye className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-200">No stocks on your watchlist</p>
          <p className="text-xs text-slate-500 max-w-xs">
            Add a stock and target price to get notified when it crosses that level.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Stock", "Target Price", "Current Price", "Gap", "Alert Type", "Status", ""].map(
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
              {items.map((item) => {
                const positive = item.gapPercent >= 0;

                return (
                  <tr
                    key={item.id}
                    className="border-b border-white/[0.03] table-row-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-200">{item.ticker}</p>
                      <p className="text-[10px] text-slate-500">{item.name}</p>
                    </td>

                    <td className="px-4 py-3 text-xs font-num text-slate-300">
                      ₹{item.targetPrice.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-3 text-xs font-num font-bold text-slate-100">
                      ₹{item.currentPrice.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs font-num font-medium",
                          positive ? "text-emerald-400" : "text-rose-400"
                        )}
                      >
                        {positive ? "+" : ""}
                        {item.gapPercent.toFixed(1)}%
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      Price {item.direction} ₹{item.targetPrice.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-3">
                      {item.triggered ? (
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

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        aria-label={`Remove ${item.ticker} from watchlist`}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
