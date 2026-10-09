import type { Metadata } from "next";
import { Bagel_Fat_One, Bricolage_Grotesque, Instrument_Sans, Nunito, Young_Serif } from "next/font/google";
import { urlDoSite } from "@/lib/og";
import "./globals.css";

// Instrument Sans é a fonte institucional; as demais são dos temas da página do bebê.
const instrumentSans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["600", "800"] });
const youngSerif = Young_Serif({ variable: "--font-young-serif", subsets: ["latin"], weight: "400" });
const bagel = Bagel_Fat_One({ variable: "--font-bagel", subsets: ["latin"], weight: "400" });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["500", "700", "800"] });

const descricao = "Chá de fraldas sem pilha de pacotes: amigos e família doam fraldas via Pix, direto para a conta da família.";

export const metadata: Metadata = {
  metadataBase: urlDoSite(),
  title: { default: "Fraldômetro", template: "%s · Fraldômetro" },
  description: descricao,
  openGraph: { type: "website", locale: "pt_BR", siteName: "Fraldômetro", title: "Fraldômetro", description: descricao },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${instrumentSans.variable} ${bricolage.variable} ${youngSerif.variable} ${bagel.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
