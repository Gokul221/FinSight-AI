"use client";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useApp } from "@/lib/AppContext";
import { cn } from "@/lib/utils";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <Topbar />
      <main
        className={cn(
          "transition-all duration-300 pt-14",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6 page-transition">{children}</div>
      </main>
    </div>
  );
}
