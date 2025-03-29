import "./globals.css";
import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { translations, DEFAULT_LOCALE } from "@/lib/constants";

const ubuntu = Ubuntu({
  weight: "700",
  style: "italic",
  subsets: ["latin"],
});

const t = translations[DEFAULT_LOCALE];

export const metadata: Metadata = {
  title: {
    default: t.title,
    template: "%s | minimal-tuner"
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
    canonical: "https://your-domain.com",
    languages: {
      "en-US": "https://your-domain.com/en",
      "ja-JP": "https://your-domain.com/ja",
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
      <body className={ubuntu.className}>{children}</body>
    </html>
  );
}
