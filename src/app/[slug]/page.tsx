import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDoBebe } from "@/components/pagina-do-bebe";
import { contracao } from "@/lib/pagina";
import { dadosParaExibir, paginaNoAr } from "@/lib/paginas";

// A página do bebê, para os convidados. Só aparece depois de publicada;
// antes disso os pais usam a prévia do painel.
export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const pagina = await paginaNoAr((await params).slug);
  if (!pagina) return {};
  // Toda página do bebê fica fora dos buscadores (ver /como-funciona).
  return { title: `Chá ${contracao(pagina.sexo)} ${pagina.nomeBebe}`, robots: { index: false, follow: false } };
}

export default async function PaginaPublica({ params }: PageProps<"/[slug]">) {
  const pagina = await paginaNoAr((await params).slug);
  if (!pagina) notFound();
  return <PaginaDoBebe dados={await dadosParaExibir(pagina)} />;
}
