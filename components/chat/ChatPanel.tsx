"use client";

import { useRef, useEffect, useState } from "react";
import { ChatMessage as ChatMessageType } from "@/lib/mockData";
import ChatMessage from "./ChatMessage";
import { Send, Paperclip, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Thinking animation
function ThinkingIndicator() {
  return (
    <div className="flex gap-3 mb-6">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center glow-indigo">
        <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
      </div>
      <div className="glass-card-2 rounded-2xl rounded-tl-none px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-400 thinking-dot" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 thinking-dot" />
          <span className="w-2 h-2 rounded-full bg-indigo-400 thinking-dot" />
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  thinking,
  onSend,
}: {
  messages: ChatMessageType[];
  thinking: boolean;
  onSend: (text: string) => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const sendMessage = (text?: string) => {
    const content = text ?? input.trim();
    if (!content || thinking) return;
    onSend(content);
    setInput("");
  };

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    const handleSend = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        sendMessageRef.current(customEvent.detail);
      }
    };
    window.addEventListener("fnsight-chat-send-question", handleSend);
    return () => {
      window.removeEventListener("fnsight-chat-send-question", handleSend);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0B0F1A]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">FinSight AI</p>
          <p className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot inline-block" />
            Online · RAG powered
          </p>
        </div>
        <div className="ml-auto text-[10px] badge-indigo px-2.5 py-1 rounded-full">
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !thinking && (
          <p className="text-xs text-slate-500 text-center mt-10">
            Ask about your portfolio, or upload a document and ask about it.
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {thinking && <ThinkingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06]">
        <div className="glass-card-2 p-3 flex flex-col gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your portfolio, earnings, market trends..."
            className={cn(
              "w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600",
              "resize-none outline-none min-h-[40px] max-h-[120px]",
              "leading-relaxed"
            )}
            rows={1}
            id="chat-input"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-slate-500 hover:text-slate-300 hover:bg-white/5"
                aria-label="Attach document"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </Button>
              <span className="text-[10px] text-slate-600">
                Attach document
              </span>
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || thinking}
              size="sm"
              className={cn(
                "h-7 px-3 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              <Send className="w-3 h-3" />
              Send
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-2">
          AI responses are grounded in your uploaded documents
        </p>
      </div>
    </div>
  );
}
