import type { Metadata, Viewport } from "next";
import { NavbarLayout } from "@/components/navigation/NavbarLayout";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://selfidbox.com"),
  title: {
    default: "人格容器",
    template: "%s — 人格容器",
  },
  description:
    "AI driven personality expression and quiz discovery platform. Create, share, and discover personality quizzes powered by AI.",
  keywords: ["personality quiz", "AI quiz", "人格测试", "心理测试", "quiz maker", "SelfIDBox"],
  authors: [{ name: "SelfIDBox" }],
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  applicationName: "人格容器",
  appleWebApp: {
    capable: true,
    title: "人格容器",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    siteName: "SelfIDBox",
    title: "人格容器 — AI 人格测验平台",
    description:
      "Create, share, and discover personality quizzes powered by AI. Find your SelfID.",
    url: "https://selfidbox.com",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "人格容器 — AI 人格测验平台",
    description:
      "Create, share, and discover personality quizzes powered by AI.",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#fffaf0",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        {/* Service Worker registration — only in production to avoid dev caching issues */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <NavbarLayout>{children}</NavbarLayout>
      </body>
    </html>
  );
}
