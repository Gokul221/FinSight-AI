"use client";

import { suggestedQuestions } from "@/lib/mockData";
import { Sparkles } from "lucide-react";

export default function SuggestedQuestions({
  onSelect,
}: {
  onSelect: (q: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <h4 className="text-xs font-semibold text-slate-300">Suggested Questions</h4>
      </div>
      <div className="flex flex-col gap-2">
        {suggestedQuestions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-left text-xs px-3 py-2.5 rounded-lg
              bg-white/[0.03] border border-white/[0.06]
              text-slate-400 hover:text-slate-200 hover:bg-indigo-600/10 hover:border-indigo-500/30
              transition-all duration-150"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
