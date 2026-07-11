"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import ChatPanel from "@/components/chat/ChatPanel";
import SourceCitationCard from "@/components/chat/SourceCitationCard";
import SuggestedQuestions from "@/components/chat/SuggestedQuestions";
import type { ChatMessage, SourceCitation } from "@/lib/mockData";
import { BookOpen } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chat")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load chat history"))))
      .then((data) => setMessages(data.messages))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const referencedDocuments = useMemo(() => {
    const seen = new Map<string, SourceCitation>();
    for (const msg of messages) {
      for (const source of msg.sources ?? []) {
        if (!seen.has(source.docName)) seen.set(source.docName, source);
      }
    }
    return [...seen.values()];
  }, [messages]);

  const sendMessage = async (content: string) => {
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: "user",
        content,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();
      setMessages((prev) => [...prev.filter((m) => m.id !== tempId), data.userMessage, data.assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't process that message. Please try again.",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-col xl:flex-row gap-4 h-[calc(100vh-theme(spacing.14)-theme(spacing.12))]">
        {/* Chat Panel */}
        <div className="flex-1 min-w-0 glass-card overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Loading conversation...
            </div>
          ) : (
            <ChatPanel messages={messages} thinking={thinking} onSend={sendMessage} />
          )}
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
            {referencedDocuments.length === 0 ? (
              <p className="text-[11px] text-slate-600">
                Ask a question about an uploaded document to see references here.
              </p>
            ) : (
              <div className="space-y-3">
                {referencedDocuments.map((s) => (
                  <SourceCitationCard key={s.id} source={s} />
                ))}
              </div>
            )}
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
