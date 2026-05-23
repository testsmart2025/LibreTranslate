import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!sheetId || !apiKey) {
      return NextResponse.json({ data: getDemoData() });
    }

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:G?key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ data: getDemoData() });
    }

    const json = await res.json();
    const rows = json.values || [];

    if (rows.length <= 1) {
      return NextResponse.json({ data: getDemoData() });
    }

    const data = rows.slice(1).map((row: string[]) => ({
      date: row[0] || "",
      btc: parseFloat(row[1]) || 0,
      eth: parseFloat(row[2]) || 0,
      aapl: parseFloat(row[3]) || 0,
      nvda: parseFloat(row[4]) || 0,
      mood: row[5] || "N/A",
      briefing: row[6] || "",
    }));

    return NextResponse.json({ data: data.slice(-30) });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ data: getDemoData() });
  }
}

function getDemoData() {
  const days = 14;
  const data = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toISOString().split("T")[0],
      btc: 65000 + Math.random() * 5000,
      eth: 3200 + Math.random() * 600,
      aapl: 185 + Math.random() * 15,
      nvda: 850 + Math.random() * 80,
      mood: ["Bullish", "Somewhat-Bullish", "Neutral"][Math.floor(Math.random() * 3)],
      briefing: "بيانات تجريبية — اربط Google Sheets لعرض البيانات الحقيقية",
    });
  }
  return data;
}
