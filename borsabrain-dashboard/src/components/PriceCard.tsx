"use client";

import { formatPrice, formatChange } from "@/lib/market";

interface PriceCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  icon: string;
  type: "crypto" | "stock";
}

export default function PriceCard({ symbol, name, price, change, icon, type }: PriceCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent)] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className="font-bold text-white">{symbol}</div>
            <div className="text-xs text-[var(--text-secondary)]">{name}</div>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
          {type === "crypto" ? "كريبتو" : "سهم"}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-white">${formatPrice(price)}</div>
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? "text-[var(--green)]" : "text-[var(--red)]"
          }`}
        >
          <span>{isPositive ? "▲" : "▼"}</span>
          <span>{formatChange(change)}</span>
        </div>
      </div>
    </div>
  );
}
