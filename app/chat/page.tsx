"use client";

import { useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import ChatPanel from "@/components/chat/ChatPanel";
import SourceCitationCard from "@/components/chat/SourceCitationCard";
import SuggestedQuestions from "@/components/chat/SuggestedQuestions";
import { sourceCitations } from "@/lib/mockData";
import { BookOpen } from "lucide-react";

export default function ChatPage() {
  const [chatInput, setChatInput] = useState("");

  return (
    <DashboardShell>
      <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-theme(spacing.14)-theme(spacing.12))]">
        {/* Chat Panel */}
        <div className="flex-1 min-w-0 glass-card overflow-hidden">
          <ChatPanel />
        </div>

        {/* Context Panel */}
        <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
          {/* Knowledge Base Context */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Knowledge Base Context
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Documents referenced in this conversation
            </p>
            <div className="space-y-3">
              {sourceCitations.map((s) => (
                <SourceCitationCard key={s.id} source={s} />
              ))}
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="glass-card p-5">
            <SuggestedQuestions onSelect={(q) => {
              window.dispatchEvent(new CustomEvent("fnsight-chat-send-question", { detail: q }));
            }} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
