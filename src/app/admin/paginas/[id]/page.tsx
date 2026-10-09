import Link from "next/link";
import { notFound } from "next/navigation";
import { botaoSecundario } from "@/components/campos";
import { Cartao, pct, Progresso, Selo, STATUS_DOACAO, STATUS_PAGINA } from "@/components/numeros";
import { paginaDoAdmin } from "@/lib/admin";
import { exigirAdmin } from "@/lib/auth";
import { formatarNumero, formatarReais } from "@/lib/dinheiro";
import { formatarData, formatarDataHora, formatarMes } from "@/lib/pagina";

export default async function AdminPagina({ params }: PageProps<"/admin/paginas/[id]">) {
  await exigirAdmin();
  const dados = await paginaDoAdmin((await params).id);
  if (!dados) notFound();
  const { pagina, membros, conta, doacoes } = dados;

  const pagas = doacoes.filter((d) => d.status === "paga");
  const soma = (campo: "fraldas" | "valorCentavos" | "comissaoCentavos") => pagas.reduce((s, d) => s + d[campo], 0);
  const arrecadado = soma("valorCentavos");
  const comissao = soma("comissaoCentavos");
  const concluidas = doacoes.filter((d) => d.status !== "aguardando").length;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12">
      <div className="grid gap-3">
        <Link href="/admin/paginas" className="text-sm font-semibold text-muted hover:text-fg">
          ← Páginas
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">{pagina.nomeBebe}</h1>
          <Selo status={pagina.status} texto={STATUS_PAGINA[pagina.status]} />
        </div>
        <p className="text-muted">
          /{pagina.slug} · criada {formatarDataHora(pagina.createdAt)}
          {pagina.mesPrevisto && ` · ${pagina.jaNasceu ? "nasceu" : "chega"} em ${formatarMes(pagina.mesPrevisto)}`}
          {pagina.encerraEm && ` · encerra ${formatarData(pagina.encerraEm)}`}
        </p>
        {pagina.status === "no_ar" && (
          <Link href={`/${pagina.slug}`} className={`${botaoSecundario} justify-self-start text-sm`}>
            Abrir a página
          </Link>
        )}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid content-start gap-2 rounded-xl border border-line bg-surface p-5">
          <span className="text-sm text-muted">Fraldas</span>
          <Progresso total={soma("fraldas")} meta={pagina.metaFraldas} />
        </div>
        <Cartao rotulo="Arrecadado" valor={formatarReais(arrecadado)} detalhe={`${formatarNumero(pagas.length)} doações pagas`} />
        <Cartao rotulo="Comissão" valor={formatarReais(comissao)} detalhe={`${formatarReais(pagina.valorFraldaCentavos)} por fralda`} />
        <Cartao rotulo="Conversão do Pix" valor={pct(pagas.length, concluidas)} detalhe={`${formatarNumero(doacoes.length)} Pix gerados`} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="grid content-start gap-2 rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Quem administra</h2>
          {membros.length === 0 && <p className="text-sm text-muted">Ninguém.</p>}
          {membros.map((m) => (
            <div key={m.id} className="grid text-sm">
              <span className="font-semibold">
                {m.nome} <span className="font-normal text-muted">· {m.papel}</span>
              </span>
              <span className="text-muted">
                {m.email}
                {m.whatsapp && ` · ${m.whatsapp}`}
              </span>
            </div>
          ))}
        </div>
        <div className="grid content-start gap-2 rounded-xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Conta Mercado Pago</h2>
          {conta ? (
            <div className="grid text-sm">
              <span className="font-semibold">{conta.titular}</span>
              <span className="text-muted">
                id {conta.mpUserId} · conectada {formatarDataHora(conta.createdAt)}
              </span>
              <span className="text-muted">token vence {formatarData(conta.expiraEm)}</span>
            </div>
          ) : (
            <p className="text-sm text-muted">Não conectada.</p>
          )}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Doações ({formatarNumero(doacoes.length)})</h2>
        {doacoes.length === 0 ? (
          <p className="text-muted">Nenhum Pix gerado ainda.</p>
        ) : (
          <ul className="grid divide-y divide-line rounded-xl border border-line bg-surface">
            {doacoes.map((d) => (
              <li key={d.id} className="grid gap-1 px-5 py-3">
                <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="flex items-center gap-2 font-semibold">
                    {d.nomeConvidado} <Selo status={d.status} texto={STATUS_DOACAO[d.status]} />
                  </span>
                  <span className="text-sm tabular-nums">
                    {formatarNumero(d.fraldas)} fraldas · <strong>{formatarReais(d.valorCentavos)}</strong>
                    <span className="text-muted"> · {d.cobriuTaxa ? "cobriu a taxa" : "taxa descontada"}</span>
                  </span>
                </span>
                {d.recado && <p className="text-sm">“{d.recado}”</p>}
                <span className="text-xs text-muted tabular-nums">
                  gerado {formatarDataHora(d.createdAt)}
                  {d.pagoEm && ` · pago ${formatarDataHora(d.pagoEm)}`}
                  {d.emailConvidado && ` · ${d.emailConvidado}`} · MP {d.gatewayCobrancaId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
