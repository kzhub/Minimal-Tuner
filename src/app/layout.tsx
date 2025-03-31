import "./globals.css";
import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { translations, DEFAULT_LOCALE } from "@/lib/constants";
import Script from "next/script";

const ubuntu = Ubuntu({
  weight: "700",
  style: "italic",
  subsets: ["latin"],
});

const t = translations[DEFAULT_LOCALE];

export const metadata: Metadata = {
  title: {
    default: t.title,
    template: "%s",
  },
  description: t.description,
  keywords: t.keywords,
  openGraph: {
    title: t.ogTitle,
    description: t.ogDescription,
    type: "website",
    locale: t.ogLocale,
    alternateLocale: "ja_JP",
  },
  alternates: {
    canonical: "https://minimal-tuner.com",
    languages: {
      "en-US": "https://minimal-tuner.com/en",
      "ja-JP": "https://minimal-tuner.com/ja",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2543187308039193"
          crossOrigin="anonymous"
        />
      </head>
      <body className={ubuntu.className}>{children}</body>
    </html>
  );
}
