import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { botaoSecundario } from "@/components/campos";
import { exigirPerfil } from "@/lib/auth";
import { contaDaPagina } from "@/lib/pagamentos";
import { paginaDoMembro } from "@/lib/paginas";
import { publicarPagina } from "../../acoes-conta";
import { atualizarPagina } from "../../acoes-pagina";
import { BotaoPublicar } from "../../form-conta";
import { FormPagina } from "../../form-pagina";

export const metadata: Metadata = { title: "Editar a página" };

const PASSO = {
  conectar: "Para publicar, conecte a conta Mercado Pago da família, que recebe o Pix.",
  publicar: "A conta da família está conectada. Já dá para publicar.",
};

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
  const noAr = pagina.status === "no_ar";
  const conta = await contaDaPagina(pagina.id);
  const passo: keyof typeof PASSO = conta ? "publicar" : "conectar";

  return (
    <div className="mx-auto grid max-w-2xl gap-8 px-4 py-12">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">{pagina.nomeBebe}</h1>
        {criada && <p className="text-muted">Página criada! Confira a prévia e ajuste o que quiser.</p>}
      </div>

      <section className="grid gap-3 rounded-xl border border-line bg-chip p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface px-3 py-1 text-sm font-semibold">{noAr ? "No ar" : "Rascunho"}</span>
          <span className="text-sm text-muted">{noAr ? `${dominio}/${pagina.slug}` : "Só vocês veem."}</span>
        </div>
        {!noAr && <p className="text-sm">{PASSO[passo]}</p>}
        <div className="flex flex-wrap gap-2">
          {noAr ? (
            <Link href={`/${pagina.slug}`} className={`${botaoSecundario} text-sm`}>
              Abrir a página
            </Link>
          ) : (
            <Link href={`/painel/paginas/${pagina.id}/previa`} className={`${botaoSecundario} text-sm`}>
              Ver prévia
            </Link>
          )}
          <Link href={`/painel/paginas/${pagina.id}/conta`} className={`${botaoSecundario} text-sm`}>
            Conta da família
          </Link>
          {!noAr && passo === "publicar" && <BotaoPublicar acao={publicarPagina.bind(null, pagina.id)} />}
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
