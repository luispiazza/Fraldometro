import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDoBebe } from "@/components/pagina-do-bebe";
import { artigo, contracao } from "@/lib/pagina";
import { dadosParaExibir, paginaNoAr } from "@/lib/paginas";
import { criarDoacao } from "./acoes-doacao";

// A página do bebê, para os convidados. Só aparece depois de publicada;
// antes disso os pais usam a prévia do painel.
export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const pagina = await paginaNoAr((await params).slug);
  if (!pagina) return {};
  const titulo = `Chá ${contracao(pagina.sexo)} ${pagina.nomeBebe}`;
  const descricao = pagina.recado?.trim() || `Escolha quantas fraldas doar para ${artigo(pagina.sexo) || ""} ${pagina.nomeBebe}, via Pix.`.replace("  ", " ");
  return {
    title: titulo,
    description: descricao,
    // O link compartilhado no grupo mostra o chá, não a home.
    openGraph: { type: "website", locale: "pt_BR", siteName: "Fraldômetro", title: titulo, description: descricao, url: `/${pagina.slug}` },
    // Toda página do bebê fica fora dos buscadores (ver /como-funciona).
    robots: { index: false, follow: false },
  };
}

export default async function PaginaPublica({ params }: PageProps<"/[slug]">) {
  const pagina = await paginaNoAr((await params).slug);
  if (!pagina) notFound();
  return <PaginaDoBebe dados={await dadosParaExibir(pagina)} acaoDoar={criarDoacao.bind(null, pagina.slug)} />;
}
