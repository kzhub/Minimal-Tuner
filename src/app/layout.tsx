import "./globals.css";
import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";

const ubuntu = Ubuntu({
  weight: "700",
  style: "italic",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "minimal-tuner | ",
  description: "Professional tuner for guitar and bass",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={ubuntu.className}>{children}</body>
    </html>
  );
}
