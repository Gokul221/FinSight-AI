"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import AllocationDonut from "@/components/portfolio/AllocationDonut";
import PerformanceChart from "@/components/portfolio/PerformanceChart";
import { portfolioHoldings } from "@/lib/mockData";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function PortfolioPage() {
  const totalValue = portfolioHoldings.reduce((s, h) => s + h.currentValue, 0);
  const totalPnL = portfolioHoldings.reduce((s, h) => s + h.pnl, 0);
  const totalPnLPercent = ((totalPnL / (totalValue - totalPnL)) * 100).toFixed(2);
  const pnlPositive = totalPnL >= 0;

  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Portfolio</h1>
            <p className="text-sm text-slate-500 mt-1">
              Holdings, allocation &amp; performance overview
            </p>
          </div>
          <div className="glass-card px-5 py-3 flex items-center gap-6">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Total Value
              </p>
              <p className="text-lg font-bold font-num text-slate-100">
                ₹{totalValue.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-px h-8 bg-white/[0.06]" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Total P&amp;L
              </p>
              <p
                className={`text-lg font-bold font-num flex items-center gap-1 ${pnlPositive ? "text-emerald-400" : "text-rose-400"}`}
              >
                {pnlPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {pnlPositive ? "+" : ""}₹{Math.abs(totalPnL).toLocaleString("en-IN")}
                <span className="text-sm font-normal">
                  ({pnlPositive ? "+" : ""}
                  {totalPnLPercent}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Main content: Holdings + Side panel */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Holdings Table */}
          <div className="xl:col-span-7">
            <HoldingsTable />
          </div>

          {/* Right: Donut + Performance */}
          <div className="xl:col-span-5 space-y-4">
            <AllocationDonut />
            <PerformanceChart />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
