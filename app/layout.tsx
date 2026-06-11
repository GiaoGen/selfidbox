import type { Metadata, Viewport } from "next";
import { NavbarLayout } from "@/components/navigation/NavbarLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "SelfIDBox",
  description: "AI driven personality expression and quiz discovery platform.",
  manifest: "/manifest.webmanifest",
  applicationName: "SelfIDBox",
  appleWebApp: {
    capable: true,
    title: "SelfIDBox",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/icon-192.png",
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
      <body className="min-h-full flex flex-col">
        <NavbarLayout>{children}</NavbarLayout>
      </body>
    </html>
  );
}
