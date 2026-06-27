"use client";

import { Alert } from "@/lib/mockData";
import { TrendingUp, BookOpen, AlertTriangle, FileText, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

const typeConfig: Record<
  Alert["type"],
  { icon: React.ReactNode; color: string; bg: string }
> = {
  price: {
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  earnings: {
    icon: <BookOpen className="w-4 h-4" />,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
  risk: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  document: {
    icon: <FileText className="w-4 h-4" />,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
  },
};

export default function AlertCard({ alert }: { alert: Alert }) {
  const [dismissed, setDismissed] = useState(false);
  const config = typeConfig[alert.type];

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "glass-card p-4 border-l-2",
        !alert.read ? "border-l-indigo-500" : "border-l-transparent",
        "hover-lift"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            config.bg,
            config.color
          )}
        >
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-200">
                {alert.title}
              </p>
              {!alert.read && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
              )}
            </div>
            <span className="text-[10px] text-slate-600 whitespace-nowrap flex-shrink-0">
              {alert.timestamp}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{alert.message}</p>

          <div className="flex items-center gap-2 mt-3">
            <Link href={alert.type === "earnings" ? "/documents" : "/portfolio"}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2.5 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-400/10"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2.5 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/5"
              onClick={() => setDismissed(true)}
            >
              <X className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
