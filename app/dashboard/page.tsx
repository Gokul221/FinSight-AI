"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import KPICard from "@/components/dashboard/KPICard";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import AIInsightBanner from "@/components/dashboard/AIInsightBanner";
import MarketMoverCard from "@/components/dashboard/MarketMoverCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import { kpiData } from "@/lib/mockData";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            Good morning, Gokul 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here&apos;s your portfolio snapshot for today — 27 Jan 2025
          </p>
        </div>

        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiData.map((kpi, i) => (
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
