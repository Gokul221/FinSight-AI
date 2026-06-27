"use client";

import { Document } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

type Status = Document["status"];

const statusConfig: Record<
  Status,
  { label: string; icon: React.ReactNode; className: string }
> = {
  indexed: {
    label: "Indexed",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: "badge-emerald",
  },
  processing: {
    label: "Processing",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    className: "badge-amber",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="w-3 h-3" />,
    className: "badge-rose",
  },
};

export default function EmbeddingStatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
        config.className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
