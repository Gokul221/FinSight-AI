"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import {
  LayoutDashboard,
  PieChart,
  MessageSquare,
  FileText,
  Bell,
  Settings,
  Zap,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { href: "/portfolio", label: "Portfolio", icon: PieChart, id: "portfolio" },
  { href: "/chat", label: "AI Assistant", icon: MessageSquare, id: "chat", pulse: true },
  { href: "/documents", label: "Documents", icon: FileText, id: "documents" },
  { href: "/alerts", label: "Alerts", icon: Bell, id: "alerts", badge: 3 },
  { href: "/settings", label: "Settings", icon: Settings, id: "settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, user, logout } = useApp();
  const displayName = user?.name ?? "...";
  const initials = user ? getInitials(user.name) : "";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out",
        "border-r border-[rgba(255,255,255,0.06)]",
        "bg-[#0D1117]",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-[rgba(255,255,255,0.06)]",
          sidebarCollapsed && "justify-center px-2"
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center glow-indigo">
          <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div>
            <span className="text-slate-100 font-bold text-base tracking-tight">
              Fin<span className="text-indigo-400">Sight</span> AI
            </span>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Finance Intelligence</p>
          </div>
        )}
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            "ml-auto flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center",
            "text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors",
            sidebarCollapsed && "ml-0"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 pl-[10px]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent"
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Icon
                      className={cn(
                        "w-4.5 h-4.5 transition-colors",
                        isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                      )}
                    />
                    {item.pulse && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
                    )}
                  </div>

                  {!sidebarCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}

                  {!sidebarCollapsed && item.badge && (
                    <span className="flex-shrink-0 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}

                  {sidebarCollapsed && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div
        className={cn(
          "border-t border-[rgba(255,255,255,0.06)] p-3",
          sidebarCollapsed ? "flex justify-center" : ""
        )}
      >
        {sidebarCollapsed ? (
          <button
            onClick={() => logout()}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
            aria-label="Logout"
            title="Logout"
          >
            {initials}
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 truncate">{user?.email}</span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="flex-shrink-0 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
