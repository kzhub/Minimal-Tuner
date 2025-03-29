import TunerClient from "@/components/TunerClient";
import { LOCALES, type Locale, translations } from "@/lib/constants";
import { Metadata } from "next";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = {
  params: {
    locale: Locale;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const t = translations[resolvedParams.locale];
  const baseUrl = "https://your-domain.com";

  return {
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
      alternateLocale: resolvedParams.locale === 'en' ? 'ja_JP' : 'en_US',
    },
    alternates: {
      canonical: `${baseUrl}/${resolvedParams.locale}`,
      languages: {
        "en-US": `${baseUrl}/en`,
        "ja-JP": `${baseUrl}/ja`,
      },
    },
  };
}

export default function Home({ params }: Props) {
  return (
    <main className="main">
      <TunerClient />
    </main>
  );
} 