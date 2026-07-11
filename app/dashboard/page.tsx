"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import KPICard from "@/components/dashboard/KPICard";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import AIInsightBanner from "@/components/dashboard/AIInsightBanner";
import MarketMoverCard from "@/components/dashboard/MarketMoverCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import { kpiData, type KPI } from "@/lib/mockData";
import { useApp } from "@/lib/AppContext";
import { withComputedFields, portfolioTotals, type RawHolding } from "@/lib/portfolio";

export default function DashboardPage() {
  const { user } = useApp();
  const firstName = user?.name.trim().split(/\s+/)[0];
  const [rawHoldings, setRawHoldings] = useState<RawHolding[] | null>(null);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load portfolio"))))
      .then((data) => setRawHoldings(data.holdings))
      .catch(() => setRawHoldings([]));
  }, []);

  const holdings = withComputedFields(rawHoldings ?? []);
  const { totalValue, totalPnL, totalPnLPercent } = portfolioTotals(holdings);
  const pnlPositive = totalPnL >= 0;
  const pnlDeltaType = totalPnL === 0 ? "neutral" : pnlPositive ? "positive" : "negative";

  const portfolioKpis: KPI[] = [
    {
      label: "Total Portfolio Value",
      value: `₹${totalValue.toLocaleString("en-IN")}`,
      delta: `${pnlPositive ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString("en-IN")} (${pnlPositive ? "+" : ""}${totalPnLPercent.toFixed(2)}%)`,
      deltaType: pnlDeltaType,
      subtext: "vs cost basis",
      icon: "TrendingUp",
    },
    {
      label: "Total P&L",
      value: `${pnlPositive ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString("en-IN")}`,
      delta: `${pnlPositive ? "+" : ""}${totalPnLPercent.toFixed(2)}%`,
      deltaType: pnlDeltaType,
      subtext: "unrealized",
      icon: "BarChart3",
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            Good morning{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s your portfolio snapshot for today — 27 Jan 2025
          </p>
        </div>

        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...portfolioKpis, ...kpiData].map((kpi, i) => (
            <KPICard key={kpi.label} kpi={kpi} index={i} />
          ))}
        </div>

        {/* Row 2: Chart + AI Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <PortfolioChart />
          </div>
          <div className="xl:col-span-4">
            <AIInsightBanner />
          </div>
        </div>

        {/* Row 3: Market Movers + Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <MarketMoverCard />
          <RecentActivityFeed />
        </div>
      </div>
    </DashboardShell>
  );
}
