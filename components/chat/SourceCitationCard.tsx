"use client";

import { SourceCitation } from "@/lib/mockData";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export default function SourceCitationCard({
  source,
  compact = false,
}: {
  source: SourceCitation;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card-2 rounded-lg border border-white/[0.06]",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-md bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="text-xs font-semibold text-slate-200 truncate">
                {source.docName}
              </p>
              <p className="text-[10px] text-slate-500">{source.section}</p>
            </div>
            <span className="flex-shrink-0 text-[10px] font-num text-indigo-400 font-bold">
              {source.relevanceScore}%
            </span>
          </div>

          {!compact && (
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2 italic line-clamp-2">
              &ldquo;{source.excerpt}&rdquo;
            </p>
          )}
          {compact && (
            <p className="text-[11px] text-slate-500 leading-relaxed mb-1.5 italic line-clamp-1">
              &ldquo;{source.excerpt}&rdquo;
            </p>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-600 uppercase tracking-wider">
              Relevance
            </span>
            <Progress
              value={source.relevanceScore}
              className="h-1 flex-1 bg-white/[0.06]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
