import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDoBebe, type DadosPagina } from "@/components/pagina-do-bebe";
import { TEMAS, isTema } from "@/themes";

export const metadata: Metadata = {
  title: "Página de exemplo",
  robots: { index: false },
};

export function generateStaticParams() {
  return TEMAS.map((t) => ({ tema: t.id }));
}

export default async function Exemplo({ params }: PageProps<"/exemplo/[tema]">) {
  const { tema } = await params;
  if (!isTema(tema)) notFound();

  const dados: DadosPagina = {
    nomeBebe: "Antonio",
    sexo: "menino",
    jaNasceu: false,
    tema,
    chegada: "dezembro",
    recado: "Pelas minhas contas, até os 2 anos vou usar umas 4.000 fraldas. Quer cuidar de algumas?",
    encerraEm: "20 de dezembro",
    fotoUrl: null,
    metaFraldas: 4000,
    valorFraldaCentavos: 200,
    totalFraldas: 2512,
    doadores: 51,
  };

  return <PaginaDoBebe dados={dados} />;
}
