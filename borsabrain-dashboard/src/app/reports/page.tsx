"use client";

import { useState, useEffect } from "react";
import MarketChart from "@/components/MarketChart";
import { getMoodColor, getMoodEmoji } from "@/lib/market";
import type { HistoryRow } from "@/lib/market";

export default function ReportsPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefing, setSelectedBriefing] = useState<HistoryRow | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-shimmer rounded-lg mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">التقارير</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          سجل الموجزات اليومية وأداء الأسعار
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <MarketChart data={history} dataKey="btc" title="تاريخ BTC" color="#f7931a" />
        <MarketChart data={history} dataKey="eth" title="تاريخ ETH" color="#627eea" />
        <MarketChart data={history} dataKey="aapl" title="تاريخ AAPL" color="#a2aaad" />
        <MarketChart data={history} dataKey="nvda" title="تاريخ NVDA" color="#76b900" />
      </div>

      <section>
        <h2 className="text-lg font-bold text-white mb-4">سجل الموجزات</h2>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-right p-4 text-[var(--text-secondary)] font-medium">التاريخ</th>
                  <th className="text-right p-4 text-[var(--text-secondary)] font-medium">BTC</th>
                  <th className="text-right p-4 text-[var(--text-secondary)] font-medium">ETH</th>
                  <th className="text-right p-4 text-[var(--text-secondary)] font-medium">AAPL</th>
                  <th className="text-right p-4 text-[var(--text-secondary)] font-medium">NVDA</th>
                  <th className="text-right p-4 text-[var(--text-secondary)] font-medium">المزاج</th>
                  <th className="text-right p-4 text-[var(--text-secondary)] font-medium">الموجز</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((row, i) => (
                  <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="p-4 text-white font-medium">{row.date}</td>
                    <td className="p-4 text-white">${row.btc.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-white">${row.eth.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                    <td className="p-4 text-white">${row.aapl.toFixed(2)}</td>
                    <td className="p-4 text-white">${row.nvda.toFixed(2)}</td>
                    <td className="p-4">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: `${getMoodColor(row.mood)}20`,
                          color: getMoodColor(row.mood),
                        }}
                      >
                        {getMoodEmoji(row.mood)} {row.mood}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setSelectedBriefing(row)}
                        className="text-[var(--accent)] hover:underline text-xs"
                      >
                        عرض الموجز
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {selectedBriefing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBriefing(null)}>
          <div
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">موجز {selectedBriefing.date}</h3>
              <button
                onClick={() => setSelectedBriefing(null)}
                className="text-[var(--text-secondary)] hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed" dir="rtl">
              {selectedBriefing.briefing || "لا يوجد موجز متوفر لهذا اليوم."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
