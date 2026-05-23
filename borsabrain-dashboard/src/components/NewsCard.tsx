"use client";

import { getMoodColor } from "@/lib/market";

interface NewsCardProps {
  title: string;
  source: string;
  sentimentLabel: string;
  sentimentScore: number;
}

const sentimentArabic: Record<string, string> = {
  "Bullish": "إيجابي",
  "Somewhat-Bullish": "إيجابي نسبياً",
  "Neutral": "محايد",
  "Somewhat-Bearish": "سلبي نسبياً",
  "Bearish": "سلبي",
};

export default function NewsCard({ title, source, sentimentLabel, sentimentScore }: NewsCardProps) {
  const color = getMoodColor(sentimentLabel);
  const arabicSentiment = sentimentArabic[sentimentLabel] || sentimentLabel;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 hover:border-[var(--accent)] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white leading-relaxed line-clamp-2">{title}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">{source}</p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {arabicSentiment} ({sentimentScore.toFixed(2)})
        </span>
      </div>
    </div>
  );
}
