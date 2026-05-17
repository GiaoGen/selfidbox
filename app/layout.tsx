import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SelfIDBox",
  description: "AI driven personality expression and quiz discovery platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
