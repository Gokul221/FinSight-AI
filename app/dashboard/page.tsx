"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import KPICard from "@/components/dashboard/KPICard";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import AIInsightBanner from "@/components/dashboard/AIInsightBanner";
import MarketMoverCard from "@/components/dashboard/MarketMoverCard";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";
import { type KPI } from "@/lib/mockData";
import { useApp } from "@/lib/AppContext";
import { withComputedFields, portfolioTotals, type RawHolding } from "@/lib/portfolio";
import type { RiskScore } from "@/lib/riskScore";
import type { MarketMoverQuote } from "@/lib/marketData";
import type { SerializedActivity } from "@/lib/activity";
import type { SerializedInsight } from "@/lib/insights";
import type { PortfolioHistoryPoint } from "@/lib/portfolioSnapshot";

const todayLabel = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const emptyRiskScore: RiskScore = { score: 0, level: "Low", topSector: null, topSectorPercent: 0 };

export default function DashboardPage() {
  const { user } = useApp();
  const firstName = user?.name.trim().split(/\s+/)[0];
  const [rawHoldings, setRawHoldings] = useState<RawHolding[] | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScore>(emptyRiskScore);
  const [movers, setMovers] = useState<MarketMoverQuote[]>([]);
  const [activity, setActivity] = useState<SerializedActivity[]>([]);
  const [insights, setInsights] = useState<SerializedInsight[]>([]);
  const [historyPoints, setHistoryPoints] = useState<PortfolioHistoryPoint[]>([]);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load portfolio"))))
      .then((data) => {
        setRawHoldings(data.holdings);
        setRiskScore(data.riskScore ?? emptyRiskScore);
      })
      .catch(() => {
        setRawHoldings([]);
        setRiskScore(emptyRiskScore);
      });

    fetch("/api/portfolio/history")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load portfolio history"))))
      .then((data) => setHistoryPoints(data.points))
      .catch(() => setHistoryPoints([]));

    fetch("/api/market-movers")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load market movers"))))
      .then((data) => setMovers(data.movers))
      .catch(() => setMovers([]));

    fetch("/api/activity")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load activity"))))
      .then((data) => setActivity(data.activity))
      .catch(() => setActivity([]));

    fetch("/api/insights")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load insights"))))
      .then((data) => setInsights(data.insights))
      .catch(() => setInsights([]));
  }, []);

  const refreshInsights = async () => {
    const res = await fetch("/api/insights/refresh", { method: "POST" });
    if (!res.ok) throw new Error("Failed to refresh insights");
    const data = await res.json();
    setInsights(data.insights);
  };

  const holdings = withComputedFields(rawHoldings ?? []);
  const { totalValue, totalPnL, totalPnLPercent } = portfolioTotals(holdings);
  const pnlPositive = totalPnL >= 0;
  const pnlDeltaType = totalPnL === 0 ? "neutral" : pnlPositive ? "positive" : "negative";

  const riskDeltaType =
    riskScore.level === "Low" ? "positive" : riskScore.level === "High" ? "negative" : "neutral";

  const kpis: KPI[] = [
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
    {
      label: "Risk Score",
      value: `${riskScore.score} / 10`,
      delta: riskScore.level,
      deltaType: riskDeltaType,
      subtext: riskScore.topSector
        ? `${riskScore.topSector} concentration ${riskScore.topSectorPercent}%`
        : "Add holdings to compute",
      icon: "Shield",
    },
    {
      label: "AI Insights",
      value: `${insights.length} new`,
      delta: "Concentration-based",
      deltaType: "neutral",
      subtext: "Generated from your portfolio",
      icon: "Sparkles",
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
            Here&apos;s your portfolio snapshot for today — {todayLabel}
          </p>
        </div>

        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KPICard key={kpi.label} kpi={kpi} index={i} />
          ))}
        </div>

        {/* Row 2: Chart + AI Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-8">
            <PortfolioChart points={historyPoints} />
          </div>
          <div className="xl:col-span-4">
            <AIInsightBanner insights={insights} onRefresh={refreshInsights} />
          </div>
        </div>

        {/* Row 3: Market Movers + Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <MarketMoverCard movers={movers} />
          <RecentActivityFeed activity={activity} />
        </div>
      </div>
    </DashboardShell>
  );
}
