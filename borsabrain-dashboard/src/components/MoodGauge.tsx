"use client";

import { getMoodColor, getMoodEmoji } from "@/lib/market";

interface MoodGaugeProps {
  mood: string;
  score: number;
}

const moodTranslations: Record<string, string> = {
  "Bullish": "صعودي",
  "Somewhat-Bullish": "صعودي نسبياً",
  "Neutral": "محايد",
  "Somewhat-Bearish": "هبوطي نسبياً",
  "Bearish": "هبوطي",
  "N/A": "غير متوفر",
};

export default function MoodGauge({ mood, score }: MoodGaugeProps) {
  const color = getMoodColor(mood);
  const emoji = getMoodEmoji(mood);
  const arabicMood = moodTranslations[mood] || mood;
  const normalizedScore = ((score + 1) / 2) * 100;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <h3 className="text-sm text-[var(--text-secondary)] mb-4">المزاج العام للسوق</h3>

      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-4xl">{emoji}</span>
        <div>
          <div className="text-xl font-bold" style={{ color }}>{arabicMood}</div>
          <div className="text-xs text-[var(--text-secondary)]">
            مؤشر المزاج: {score.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="w-full h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(5, normalizedScore)}%`,
            background: `linear-gradient(90deg, var(--red), var(--yellow), var(--green))`,
          }}
        />
      </div>

      <div className="flex justify-between mt-1 text-xs text-[var(--text-secondary)]">
        <span>هبوطي</span>
        <span>محايد</span>
        <span>صعودي</span>
      </div>
    </div>
  );
}
