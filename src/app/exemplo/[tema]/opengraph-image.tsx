import { notFound } from "next/navigation";
import { imagemDaPagina } from "@/lib/og-pagina";
import { TAMANHO_OG } from "@/lib/og";
import { isTema, TEMAS } from "@/themes";
import { dadosDeExemplo } from "./dados";

export const alt = "Página de exemplo do Fraldômetro";
export const size = TAMANHO_OG;
export const contentType = "image/png";

export function generateStaticParams() {
  return TEMAS.map((t) => ({ tema: t.id }));
}

export default async function Imagem({ params }: { params: Promise<{ tema: string }> }) {
  const { tema } = await params;
  if (!isTema(tema)) notFound();
  return imagemDaPagina(dadosDeExemplo(tema));
}
