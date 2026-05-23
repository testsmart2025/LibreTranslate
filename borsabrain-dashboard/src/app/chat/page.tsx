"use client";

import ChatWidget from "@/components/ChatWidget";

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="p-6 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span>💬</span>
          <span>المحادثة الذكية</span>
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          اسأل عن أسعار السوق والأخبار المالية
        </p>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatWidget />
      </div>
    </div>
  );
}
