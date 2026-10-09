import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { botaoSecundario } from "@/components/campos";
import { Cartao, Progresso } from "@/components/numeros";
import { exigirPerfil } from "@/lib/auth";
import { diasDeFralda, formatarNumero, formatarReais } from "@/lib/dinheiro";
import { contaDaPagina } from "@/lib/pagamentos";
import { formatarDataHora } from "@/lib/pagina";
import { doacoesPagas, paginaDoMembro, resumoDaPagina } from "@/lib/paginas";
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
  const [conta, resumo, doacoes] = await Promise.all([
    contaDaPagina(pagina.id),
    resumoDaPagina(pagina.id),
    doacoesPagas(pagina.id),
  ]);
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

      {(noAr || doacoes.length > 0) && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Como está indo</h2>
          <div className="grid content-start gap-2 rounded-xl border border-line bg-surface p-5">
            <span className="text-sm text-muted">Fraldas</span>
            <Progresso total={resumo.fraldas} meta={pagina.metaFraldas} />
            {resumo.fraldas > 0 && (
              <span className="text-sm text-muted">
                Dá para uns {formatarNumero(diasDeFralda(resumo.fraldas))} dias de fralda
                {resumo.fraldas7 > 0 && ` · ${formatarNumero(resumo.fraldas7)} chegaram nos últimos 7 dias`}
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Cartao rotulo="Recebido" valor={formatarReais(resumo.recebido)} detalhe="antes da taxa do Mercado Pago" />
            <Cartao
              rotulo="Pessoas que doaram"
              valor={formatarNumero(resumo.doadores)}
              detalhe={resumo.aguardando ? `${formatarNumero(resumo.aguardando)} Pix aguardando pagamento` : undefined}
            />
            <Cartao
              rotulo="Média por pessoa"
              valor={resumo.doadores ? `${formatarNumero(Math.round(resumo.fraldas / resumo.doadores))} fraldas` : "—"}
              detalhe={resumo.doadores ? formatarReais(Math.round(resumo.recebido / resumo.doadores)) : undefined}
            />
          </div>
        </section>
      )}

      {(noAr || doacoes.length > 0) && (
        <section className="grid gap-3">
          <h2 className="text-xl font-semibold">Quem doou</h2>
          {doacoes.length === 0 ? (
            <p className="text-muted">Ninguém ainda. Mande o link no grupo da família!</p>
          ) : (
            <ul className="grid max-h-[480px] divide-y divide-line overflow-y-auto rounded-xl border border-line bg-surface">
              {doacoes.map((d) => (
                <li key={d.id} className="grid gap-1 px-5 py-3">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span className="font-semibold">{d.nome}</span>
                    <span className="text-sm tabular-nums">
                      {formatarNumero(d.fraldas)} {d.fraldas === 1 ? "fralda" : "fraldas"} ·{" "}
                      <span className="text-muted">{formatarReais(d.recebido)}</span>
                    </span>
                  </span>
                  {d.recado && <p className="text-sm">“{d.recado}”</p>}
                  <span className="text-xs text-muted tabular-nums">{formatarDataHora(d.pagoEm)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <h2 className="-mb-4 text-xl font-semibold">Editar a página</h2>
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
