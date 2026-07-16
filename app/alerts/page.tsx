"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import AlertCard from "@/components/alerts/AlertCard";
import WatchlistTable from "@/components/alerts/WatchlistTable";
import { Skeleton } from "@/components/ui/skeleton";
import { alerts } from "@/lib/mockData";
import { withComputedFields, type RawWatchlistItem } from "@/lib/watchlist";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AlertsPage() {
  const unread = alerts.filter((a) => !a.read).length;

  const [rawItems, setRawItems] = useState<RawWatchlistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/watchlist")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load watchlist"))))
      .then((data) => setRawItems(data.items))
      .catch(() => setError("Couldn't load your watchlist. Please refresh the page."));
  }, []);

  const refreshPrices = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/watchlist/refresh", { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh prices");
      const data = await res.json();
      setRawItems(data.items);
    } catch {
      setRefreshError("Couldn't refresh live prices. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const loading = rawItems === null && !error;
  const items = withComputedFields(rawItems ?? []);

  const removeItem = async (id: string) => {
    const previous = rawItems ?? [];
    setRawItems(previous.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove watchlist item");
    } catch {
      setRawItems(previous);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Alerts &amp; Watchlist
              {unread > 0 && (
                <span className="text-xs badge-rose px-2 py-0.5 rounded-full font-medium">
                  {unread} new
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Price alerts, earnings notifications, and portfolio risk events
            </p>
          </div>
          {!loading && !error && items.length > 0 && (
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
        </div>

        {error && <div className="glass-card p-4 text-sm text-rose-400">{error}</div>}
        {refreshError && <div className="glass-card p-4 text-sm text-rose-400">{refreshError}</div>}

        {/* Watchlist */}
        {loading ? (
          <Skeleton className="h-52" />
        ) : (
          !error && (
            <WatchlistTable
              items={items}
              onAdded={(item) => setRawItems((prev) => [...(prev ?? []), item])}
              onDelete={removeItem}
            />
          )
        )}

        {/* Alert Feed */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-300">Alert Feed</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
