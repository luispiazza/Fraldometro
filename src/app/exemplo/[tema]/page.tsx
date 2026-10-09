import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDoBebe } from "@/components/pagina-do-bebe";
import { TEMAS, isTema } from "@/themes";
import { dadosDeExemplo } from "./dados";

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
  return <PaginaDoBebe dados={dadosDeExemplo(tema)} />;
}

