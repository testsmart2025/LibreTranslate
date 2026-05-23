import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    let marketContext = "";
    try {
      const origin = request.headers.get("origin") || request.headers.get("host") || "localhost:3000";
      const protocol = origin.includes("localhost") ? "http" : "https";
      const baseUrl = origin.startsWith("http") ? origin : `${protocol}://${origin}`;
      const marketRes = await fetch(`${baseUrl}/api/market`);
      if (marketRes.ok) {
        const data = await marketRes.json();
        marketContext = `\n\nبيانات السوق الحالية:\n${JSON.stringify(data, null, 2)}`;
      }
    } catch {
      marketContext = "\n\nبيانات السوق غير متوفرة حالياً.";
    }

    const systemPrompt = `أنت مساعد BorsaBrain لموجز الأسواق المالية. ترد بالعربية.
أنت تُلخص بيانات السوق والأخبار فقط.
لا تقدم نصائح استثمارية أبداً. لا تقل اشترِ أو بِع أو احتفظ.
إذا سألك المستخدم عن رأيك في الاستثمار، قل: "لا أقدم نصائح استثمارية. يرجى استشارة مستشار مالي مرخص."
اجعل ردودك مختصرة ومفيدة.${marketContext}`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: "⚠️ مفتاح API غير مهيأ. يرجى إعداد OPENROUTER_API_KEY." });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "لم أتمكن من توليد رد. حاول مرة أخرى.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ reply: "حدث خطأ في الخادم. حاول مرة أخرى." }, { status: 500 });
  }
}
