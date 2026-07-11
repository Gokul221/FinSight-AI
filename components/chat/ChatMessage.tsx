"use client";

import { ChatMessage as ChatMessageType } from "@/lib/mockData";
import { Zap, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import SourceCitationCard from "./SourceCitationCard";
import { Button } from "@/components/ui/button";

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center glow-indigo">
          <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
      )}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
          GK
        </div>
      )}

      {/* Bubble */}
      <div className={cn("max-w-[80%] flex flex-col gap-3", isUser && "items-end")}>
        {/* Sender label */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-[10px]",
            isUser ? "flex-row-reverse text-slate-500" : "text-slate-500"
          )}
        >
          <span>{isUser ? "You" : "FinSight AI"}</span>
          <span>·</span>
          <span>{message.timestamp}</span>
        </div>

        {/* Message content */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-indigo-600 text-white rounded-tr-none"
              : "glass-card-2 text-slate-300 rounded-tl-none"
          )}
        >
          {/* Render content with markdown-like bold and bullet lists */}
          {message.content.split("\n").map((line, i) => {
            const bulletMatch = line.match(/^[*-]\s+(.*)/);
            const lineText = bulletMatch ? bulletMatch[1] : line;
            const parts = lineText.split(/\*\*(.*?)\*\*/g);
            const rendered = parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-white font-semibold">
                  {part}
                </strong>
              ) : (
                part
              )
            );
            return bulletMatch ? (
              <div key={i} className={cn("flex gap-2", i > 0 && "mt-2")}>
                <span className="text-slate-500">•</span>
                <p className="flex-1">{rendered}</p>
              </div>
            ) : (
              <p key={i} className={i > 0 ? "mt-2" : ""}>
                {rendered}
              </p>
            );
          })}
        </div>

        {/* Inline table */}
        {message.table && (
          <div className="glass-card overflow-hidden w-full max-w-none">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {message.table.headers.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-slate-400 font-medium uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] table-row-hover">
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        className={cn(
                          "px-3 py-2 font-num",
                          j === 0 ? "text-slate-200 font-medium" : "text-slate-400"
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
              Referenced {message.sources.length} documents from your knowledge base
            </p>
            {message.sources.map((source) => (
              <SourceCitationCard key={source.id} source={source} compact />
            ))}
          </div>
        )}

        {/* Feedback buttons (assistant only) */}
        {!isUser && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 text-[10px]"
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              Helpful
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 text-[10px]"
            >
              <ThumbsDown className="w-3 h-3 mr-1" />
              Not helpful
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
