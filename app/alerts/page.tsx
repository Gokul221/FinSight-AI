"use client";

import DashboardShell from "@/components/layout/DashboardShell";
import AlertCard from "@/components/alerts/AlertCard";
import WatchlistTable from "@/components/alerts/WatchlistTable";
import { alerts } from "@/lib/mockData";
import { Bell, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AlertsPage() {
  const unread = alerts.filter((a) => !a.read).length;

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
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.1] text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs"
          >
            <Filter className="w-3 h-3 mr-1.5" />
            Filter
          </Button>
        </div>

        {/* Watchlist */}
        <WatchlistTable />

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
