import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "BorsaBrain - موجز الأسواق الذكي",
  description: "داش بورد ذكي لمتابعة الأسواق المالية والعملات الرقمية مع تحليل الأخبار بالذكاء الاصطناعي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="min-h-full flex">
        <div className="flex-1 overflow-auto">{children}</div>
        <Sidebar />
      </body>
    </html>
  );
}
