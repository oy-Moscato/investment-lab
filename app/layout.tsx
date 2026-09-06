import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://investment-lab.decent-finch-3957.chatgpt.site"),
  title: "Investment Lab | 长期投资研究工作台",
  description: "把公司研究、财务分析、估值、投资逻辑与决策日志放进一个长期可维护的个人研究系统。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Investment Lab",
    title: "Investment Lab | 长期投资研究工作台",
    description: "把公司研究、财务分析、估值、投资逻辑与决策日志放进一个长期可维护的个人研究系统。",
    images: ["https://investment-lab.decent-finch-3957.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Investment Lab | 长期投资研究工作台",
    description: "把公司研究、财务分析、估值、投资逻辑与决策日志放进一个长期可维护的个人研究系统。",
    images: ["https://investment-lab.decent-finch-3957.chatgpt.site/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0d16",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
