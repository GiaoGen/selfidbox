import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC } from "next/font/google";
import { NavbarLayout } from "@/components/navigation/NavbarLayout";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto-sans-sc",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://selfidbox.com"),
  title: {
    default: "SelfIDBox",
    template: "%s — SelfIDBox",
  },
  description:
    "AI driven personality expression and quiz discovery platform. Create, share, and discover personality quizzes powered by AI.",
  keywords: ["personality quiz", "AI quiz", "人格测试", "心理测试", "quiz maker", "SelfIDBox"],
  authors: [{ name: "SelfIDBox" }],
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  applicationName: "SelfIDBox",
  appleWebApp: {
    capable: true,
    title: "SelfIDBox",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    type: "website",
    siteName: "SelfIDBox",
    title: "SelfIDBox — AI Personality Quiz Platform",
    description:
      "Create, share, and discover personality quizzes powered by AI. Find your SelfID.",
    url: "https://selfidbox.com",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "SelfIDBox — AI Personality Quiz Platform",
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
    <html lang="zh-CN" className={`h-full antialiased ${notoSansSC.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <NavbarLayout>{children}</NavbarLayout>
      </body>
    </html>
  );
}
