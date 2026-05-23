import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [cryptoRes, aaplRes, nvdaRes, newsRes] = await Promise.allSettled([
      fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true${
          process.env.COINGECKO_API_KEY ? `&x_cg_demo_api_key=${process.env.COINGECKO_API_KEY}` : ""
        }`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${process.env.ALPHA_VANTAGE_API_KEY || "demo"}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${process.env.ALPHA_VANTAGE_API_KEY || "demo"}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL,NVDA,CRYPTO:BTC,CRYPTO:ETH&apikey=${process.env.ALPHA_VANTAGE_API_KEY || "demo"}`,
        { next: { revalidate: 600 } }
      ),
    ]);

    const cryptoData = cryptoRes.status === "fulfilled" ? await cryptoRes.value.json() : null;
    const aaplData = aaplRes.status === "fulfilled" ? await aaplRes.value.json() : null;
    const nvdaData = nvdaRes.status === "fulfilled" ? await nvdaRes.value.json() : null;
    const newsData = newsRes.status === "fulfilled" ? await newsRes.value.json() : null;

    const crypto = [
      {
        symbol: "BTC",
        name: "Bitcoin",
        price: cryptoData?.bitcoin?.usd ?? 0,
        change24h: cryptoData?.bitcoin?.usd_24h_change ?? 0,
        icon: "₿",
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        price: cryptoData?.ethereum?.usd ?? 0,
        change24h: cryptoData?.ethereum?.usd_24h_change ?? 0,
        icon: "Ξ",
      },
    ];

    const aaplQuote = aaplData?.["Global Quote"];
    const nvdaQuote = nvdaData?.["Global Quote"];

    const stocks = [
      {
        symbol: "AAPL",
        name: "Apple",
        price: parseFloat(aaplQuote?.["05. price"] || "0"),
        changePct: parseFloat(aaplQuote?.["10. change percent"]?.replace("%", "") || "0"),
        icon: "🍎",
      },
      {
        symbol: "NVDA",
        name: "NVIDIA",
        price: parseFloat(nvdaQuote?.["05. price"] || "0"),
        changePct: parseFloat(nvdaQuote?.["10. change percent"]?.replace("%", "") || "0"),
        icon: "🟢",
      },
    ];

    const news: Array<{
      title: string;
      source: string;
      sentimentScore: number;
      sentimentLabel: string;
      url?: string;
    }> = [];

    if (newsData?.feed && Array.isArray(newsData.feed)) {
      newsData.feed.slice(0, 8).forEach((item: Record<string, unknown>) => {
        news.push({
          title: (item.title as string) || "",
          source: (item.source as string) || "",
          sentimentScore: parseFloat(item.overall_sentiment_score as string) || 0,
          sentimentLabel: (item.overall_sentiment_label as string) || "Neutral",
          url: item.url as string | undefined,
        });
      });
    }

    let moodScore = 0;
    let overallMood = "N/A";
    if (news.length > 0) {
      moodScore = news.reduce((sum, n) => sum + n.sentimentScore, 0) / news.length;
      if (moodScore >= 0.35) overallMood = "Bullish";
      else if (moodScore >= 0.15) overallMood = "Somewhat-Bullish";
      else if (moodScore >= -0.15) overallMood = "Neutral";
      else if (moodScore >= -0.35) overallMood = "Somewhat-Bearish";
      else overallMood = "Bearish";
    }

    return NextResponse.json({
      crypto,
      stocks,
      news,
      overallMood,
      moodScore,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
