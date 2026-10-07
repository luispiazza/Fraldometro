import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaDoBebe } from "@/components/pagina-do-bebe";
import { exigirPerfil } from "@/lib/auth";
import { dadosParaExibir, paginaDoMembro } from "@/lib/paginas";

export const metadata: Metadata = { title: "Prévia", robots: { index: false } };

// A página como os convidados vão ver, ainda sem estar no ar.
export default async function Previa({ params }: PageProps<"/painel/paginas/[id]/previa">) {
  const perfil = await exigirPerfil();
  const { id } = await params;
  const pagina = await paginaDoMembro(id, perfil.id);
  if (!pagina) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-fg px-4 py-2.5 text-center text-sm text-bg">
        Prévia: é assim que os convidados vão ver a página.
        <Link href={`/painel/paginas/${pagina.id}`} className="font-semibold underline">
          Voltar e editar
        </Link>
      </div>
      <PaginaDoBebe dados={await dadosParaExibir(pagina)} />
    </>
  );
}
