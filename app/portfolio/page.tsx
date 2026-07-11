"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import HoldingsTable from "@/components/portfolio/HoldingsTable";
import AllocationDonut from "@/components/portfolio/AllocationDonut";
import PerformanceChart from "@/components/portfolio/PerformanceChart";
import AddHoldingDialog from "@/components/portfolio/AddHoldingDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { withComputedFields, type RawHolding } from "@/lib/portfolio";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

export default function PortfolioPage() {
  const [rawHoldings, setRawHoldings] = useState<RawHolding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load portfolio"))))
      .then((data) => setRawHoldings(data.holdings))
      .catch(() => setError("Couldn't load your portfolio. Please refresh the page."));
  }, []);

  const refreshPrices = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/portfolio/refresh-prices", { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh prices");
      const data = await res.json();
      setRawHoldings(data.holdings);
    } catch {
      setRefreshError("Couldn't refresh live prices. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const loading = rawHoldings === null && !error;
  const holdings = withComputedFields(rawHoldings ?? []);

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalPnL = holdings.reduce((s, h) => s + h.pnl, 0);
  const costBasis = totalValue - totalPnL;
  const totalPnLPercent = costBasis > 0 ? ((totalPnL / costBasis) * 100).toFixed(2) : "0.00";
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
          <div className="flex items-center gap-3">
            {!loading && !error && (
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
            )}
            {!loading && !error && holdings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPrices}
                disabled={refreshing}
                className="border-white/[0.1] text-slate-300 hover:bg-white/5 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh Prices"}
              </Button>
            )}
            <AddHoldingDialog
              onAdded={(holding) => setRawHoldings((prev) => [...(prev ?? []), holding])}
            />
          </div>
        </div>

        {error && (
          <div className="glass-card p-4 text-sm text-rose-400">{error}</div>
        )}

        {refreshError && (
          <div className="glass-card p-4 text-sm text-rose-400">{refreshError}</div>
        )}

        {loading && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <Skeleton className="xl:col-span-7 h-80" />
            <Skeleton className="xl:col-span-5 h-80" />
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Holdings Table */}
            <div className="xl:col-span-7">
              <HoldingsTable holdings={holdings} />
            </div>

            {/* Right: Donut + Performance */}
            <div className="xl:col-span-5 space-y-4">
              <AllocationDonut />
              <PerformanceChart />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
