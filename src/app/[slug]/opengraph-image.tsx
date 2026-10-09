import { notFound } from "next/navigation";
import { imagemDaPagina } from "@/lib/og-pagina";
import { TAMANHO_OG } from "@/lib/og";
import { dadosParaExibir, paginaNoAr } from "@/lib/paginas";

export const alt = "Página do chá de fraldas no Fraldômetro";
export const size = TAMANHO_OG;
export const contentType = "image/png";

export default async function Imagem({ params }: { params: Promise<{ slug: string }> }) {
  const pagina = await paginaNoAr((await params).slug);
  if (!pagina) notFound();
  return imagemDaPagina(await dadosParaExibir(pagina));
}
