"use client";

import { useState, useEffect } from "react";
import PriceCard from "@/components/PriceCard";
import MoodGauge from "@/components/MoodGauge";
import NewsCard from "@/components/NewsCard";
import MarketChart from "@/components/MarketChart";
import type { MarketData, HistoryRow } from "@/lib/market";

export default function DashboardPage() {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [marketRes, historyRes] = await Promise.all([
          fetch("/api/market"),
          fetch("/api/history"),
        ]);
        if (marketRes.ok) setMarket(await marketRes.json());
        if (historyRes.ok) {
          const h = await historyRes.json();
          setHistory(h.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="h-8 w-48 animate-shimmer rounded-lg mb-2" />
          <div className="h-4 w-64 animate-shimmer rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          آخر تحديث: {market?.lastUpdated ? new Date(market.lastUpdated).toLocaleString("ar-SA") : "—"}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {market?.crypto.map((c) => (
          <PriceCard
            key={c.symbol}
            symbol={c.symbol}
            name={c.name}
            price={c.price}
            change={c.change24h}
            icon={c.icon}
            type="crypto"
          />
        ))}
        {market?.stocks.map((s) => (
          <PriceCard
            key={s.symbol}
            symbol={s.symbol}
            name={s.name}
            price={s.price}
            change={s.changePct}
            icon={s.icon}
            type="stock"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-1">
          <MoodGauge mood={market?.overallMood || "N/A"} score={market?.moodScore || 0} />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <MarketChart data={history} dataKey="btc" title="Bitcoin (BTC)" color="#f7931a" />
          <MarketChart data={history} dataKey="eth" title="Ethereum (ETH)" color="#627eea" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <MarketChart data={history} dataKey="aapl" title="Apple (AAPL)" color="#a2aaad" />
        <MarketChart data={history} dataKey="nvda" title="NVIDIA (NVDA)" color="#76b900" />
      </div>

      {market?.news && market.news.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">آخر الأخبار</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {market.news.map((n, i) => (
              <NewsCard
                key={i}
                title={n.title}
                source={n.source}
                sentimentLabel={n.sentimentLabel}
                sentimentScore={n.sentimentScore}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
