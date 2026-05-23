"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: "📊" },
  { href: "/reports", label: "التقارير", icon: "📋" },
  { href: "/chat", label: "المحادثة", icon: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-l border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span>BorsaBrain</span>
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">موجز الأسواق الذكي</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="text-xs text-[var(--text-secondary)] text-center">
          BorsaBrain v1.0
        </div>
      </div>
    </aside>
  );
}
