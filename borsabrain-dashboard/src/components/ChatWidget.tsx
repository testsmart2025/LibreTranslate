"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "@/lib/market";

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "مرحباً! أنا مساعد BorsaBrain. اسألني عن أسعار السوق والأخبار المالية. ⚠️ لا أقدم نصائح استثمارية." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "حدث خطأ. حاول مرة أخرى." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent)] text-white rounded-tl-sm"
                  : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-tr-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl rounded-tr-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="اسأل عن السوق..."
            className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-white placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            dir="rtl"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-[var(--accent)] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#5558e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إرسال
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
          ⚠️ هذا موجز معلوماتي فقط وليس نصيحة مالية
        </p>
      </div>
    </div>
  );
}
