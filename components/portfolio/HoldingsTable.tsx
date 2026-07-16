"use client";

import { useState } from "react";
import type { Holding } from "@/lib/mockData";
import {
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Bell,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SortKey = "name" | "currentValue" | "pnl" | "pnlPercent" | "weight";

export default function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("currentValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  if (holdings.length === 0) {
    return (
      <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center text-slate-500 mb-1">
          <Wallet className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium text-slate-200">No holdings yet</p>
        <p className="text-xs text-slate-500 max-w-xs">
          Add the stocks you own to see your portfolio value, allocation, and
          P&amp;L here.
        </p>
      </div>
    );
  }

  const sorted = [...holdings].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === "string" && typeof vb === "string") {
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortDir === "asc"
      ? (va as number) - (vb as number)
      : (vb as number) - (va as number);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const ColHeader = ({
    label,
    sortable,
    k,
    align = "right",
  }: {
    label: string;
    sortable?: SortKey;
    k?: string;
    align?: "left" | "right";
  }) => (
    <th
      className={cn(
        "px-3 py-3 text-[10px] uppercase tracking-wider text-slate-500 font-medium whitespace-nowrap",
        align === "right" ? "text-right" : "text-left",
        sortable && "cursor-pointer hover:text-slate-300 select-none",
      )}
      onClick={sortable ? () => handleSort(sortable) : undefined}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          align === "right" ? "justify-end" : "justify-start",
        )}
      >
        {label}
        {sortable && sortKey === sortable && (
          <ArrowUpDown className="w-3 h-3 text-indigo-400" />
        )}
      </div>
    </th>
  );

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Holdings</h3>
        <span className="text-xs text-slate-500">
          {holdings.length} positions
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <ColHeader label="Stock" sortable="name" align="left" />
              <ColHeader label="Qty" align="right" />
              <ColHeader label="Avg Buy" align="right" />
              <ColHeader label="LTP" align="right" />
              <ColHeader label="Value" sortable="currentValue" align="right" />
              <ColHeader label="P&L" sortable="pnl" align="right" />
              <ColHeader label="Wt%" sortable="weight" align="right" />
              <ColHeader label="Actions" align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => {
              const positive = h.pnl >= 0;
              return (
                <tr
                  key={h.id}
                  className="border-b border-white/[0.03] table-row-hover transition-colors"
                >
                  {/* Stock Name */}
                  <td className="px-3 py-3">
                    <p className="text-xs font-semibold text-slate-200">
                      {h.ticker}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {h.name}
                    </p>
                  </td>

                  {/* Qty */}
                  <td className="px-3 py-3 text-right text-xs font-num text-slate-300">
                    {h.quantity}
                  </td>

                  {/* Avg Buy */}
                  <td className="px-3 py-3 text-right text-xs font-num text-slate-400">
                    ₹{h.avgBuyPrice.toLocaleString("en-IN")}
                  </td>

                  {/* LTP */}
                  <td className="px-3 py-3 text-right text-xs font-num text-slate-200 font-medium">
                    ₹{h.currentPrice.toLocaleString("en-IN")}
                  </td>

                  {/* Value */}
                  <td className="px-3 py-3 text-right text-xs font-num font-bold text-slate-100">
                    ₹{h.currentValue.toLocaleString("en-IN")}
                  </td>

                  {/* P&L */}
                  <td className="px-3 py-3 text-right">
                    <div
                      className={cn(
                        "flex flex-col items-end gap-0.5",
                        positive ? "text-emerald-400" : "text-rose-400",
                      )}
                    >
                      <div className="flex items-center gap-0.5 text-xs font-num font-bold">
                        {positive ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        ₹{Math.abs(h.pnl).toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] opacity-80">
                        {positive ? "+" : ""}
                        {h.pnlPercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>

                  {/* Weight */}
                  <td className="px-3 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-num text-slate-300">
                        {h.weight}%
                      </span>
                      <div className="w-12 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${Math.min((h.weight / 20) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href="/chat">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Analyse
                        </Button>
                      </Link>
                      <Link href="/alerts">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        >
                          <Bell className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
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
