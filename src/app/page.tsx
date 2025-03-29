import TunerClient from "../components/TunerClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/en",
  },
};

export default function RootPage() {
  return (
    <main className="main">
      <TunerClient />
    </main>
  );
}
