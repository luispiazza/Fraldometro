import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { botaoSecundario } from "@/components/campos";
import { exigirPerfil } from "@/lib/auth";
import { paginaDoMembro } from "@/lib/paginas";
import { atualizarPagina } from "../../acoes-pagina";
import { FormPagina } from "../../form-pagina";

export const metadata: Metadata = { title: "Editar a página" };

const reais = (centavos: number) => (centavos / 100).toFixed(2).replace(".", ",");
// encerra_em é o fim do dia em Brasília; a data do formulário é o dia de lá.
const dia = (d: Date | null) => (d ? new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10) : "");

export default async function EditarPagina({ params, searchParams }: PageProps<"/painel/paginas/[id]">) {
  const perfil = await exigirPerfil();
  const { id } = await params;
  const pagina = await paginaDoMembro(id, perfil.id);
  if (!pagina) notFound();

  const criada = (await searchParams).criada === "1";
  const dominio = (await headers()).get("host") ?? "fraldometro";

  return (
    <div className="mx-auto grid max-w-2xl gap-8 px-4 py-12">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">{pagina.nomeBebe}</h1>
        {criada && <p className="text-muted">Página criada! Confira a prévia e ajuste o que quiser.</p>}
      </div>

      <section className="grid gap-3 rounded-xl border border-line bg-chip p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold">Rascunho</span>
          <span className="text-sm text-muted">Só vocês veem.</span>
        </div>
        <p className="text-sm">
          Para publicar, falta abrir a conta da família que recebe o Pix. Isso chega na próxima etapa do Fraldômetro.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/painel/paginas/${pagina.id}/previa`} className={`${botaoSecundario} text-sm`}>
            Ver prévia
          </Link>
          <button disabled className="rounded-full bg-fg px-5 py-3 text-sm font-semibold text-bg disabled:opacity-50">
            Publicar · em breve
          </button>
        </div>
      </section>

      <FormPagina
        inicial={{
          nomeBebe: pagina.nomeBebe,
          sexo: pagina.sexo,
          jaNasceu: pagina.jaNasceu,
          mesPrevisto: pagina.mesPrevisto ?? "",
          fotoPath: pagina.fotoPath,
          recado: pagina.recado ?? "",
          tema: pagina.tema,
          metaFraldas: pagina.metaFraldas,
          valorFralda: reais(pagina.valorFraldaCentavos),
          encerraEm: dia(pagina.encerraEm),
          slug: pagina.slug,
        }}
        userId={perfil.id}
        dominio={dominio}
        acao={atualizarPagina.bind(null, pagina.id)}
        textoBotao="Salvar alterações"
      />
    </div>
  );
}
