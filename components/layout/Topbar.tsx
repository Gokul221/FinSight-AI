"use client";

import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import { Bell, Search, Sun, Moon, Zap, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/portfolio": "Portfolio",
  "/chat": "AI Assistant",
  "/documents": "Documents",
  "/alerts": "Alerts & Watchlist",
  "/settings": "Settings",
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, darkMode, setDarkMode, user, logout } = useApp();

  const pageTitle = breadcrumbMap[pathname] ?? "FinSight AI";
  const initials = user ? getInitials(user.name) : "";

  return (
    <header
      className={`fixed top-0 right-0 z-30 flex items-center h-14 gap-4 px-6
        border-b border-border bg-card/80 backdrop-blur-xl
        transition-all duration-300`}
      style={{
        left: sidebarCollapsed ? "4rem" : "16rem",
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-slate-500 text-sm">FinSight AI</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-200 text-sm font-medium">{pageTitle}</span>
      </div>

      {/* Global Search */}
      <div className="flex-1 max-w-xl mx-auto">
        <button
          onClick={() => router.push("/chat")}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg
            bg-white/[0.04] border border-white/[0.07] text-slate-500 text-sm
            hover:bg-white/[0.07] hover:border-indigo-500/30 hover:text-slate-300
            transition-all duration-150 group"
          id="topbar-search"
          aria-label="Open AI chat"
        >
          <Search className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
          <span className="flex-1 text-left truncate">Ask anything about your portfolio...</span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Zap className="w-3 h-3 text-indigo-500" />
            <span className="text-[10px] text-indigo-400 font-medium">AI</span>
          </div>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-slate-400 hover:text-slate-200 hover:bg-white/5"
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle dark mode"
          id="topbar-darkmode-toggle"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-slate-400 hover:text-slate-200 hover:bg-white/5 relative"
          onClick={() => router.push("/alerts")}
          aria-label="View notifications"
          id="topbar-notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </Button>

        {/* Avatar menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            title={user?.name}
            aria-label="Open account menu"
            id="topbar-avatar-menu"
          >
            {initials}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {user && (
              <>
                <DropdownMenuLabel>
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => logout()}>
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
