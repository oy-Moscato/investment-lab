import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investment Lab | 长期投资研究工作台",
  description: "把公司研究、财务分析、估值、投资逻辑与决策日志放进一个长期可维护的个人研究系统。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
