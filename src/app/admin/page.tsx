import Link from "next/link";
import { Cartao, GraficoDiario, Lista, pct, STATUS_PAGINA } from "@/components/numeros";
import { atividadeRecente, numerosDoAdmin } from "@/lib/admin";
import { exigirAdmin } from "@/lib/auth";
import { formatarNumero, formatarReais } from "@/lib/dinheiro";
import { formatarDataHora } from "@/lib/pagina";

export default async function Admin() {
  await exigirAdmin();
  const [{ doacoes: d, paginas: p, contas: c, usuarios: u, webhooks: w, maiores, dias }, recente] = await Promise.all([
    numerosDoAdmin(),
    atividadeRecente(),
  ]);
  // Pix que já tiveram desfecho: os que ainda aguardam não entram na conversão.
  const concluidos = d.gerados - d.aguardando;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12">
      <h1 className="titulo text-4xl leading-tight">Visão geral</h1>

      <section className="grid gap-3">
        <h2 className="titulo text-xl">Últimos 30 dias</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Cartao rotulo="Arrecadado" valor={formatarReais(d.arrecadado30)} detalhe={`${formatarNumero(d.pagas30)} doações`} />
          <Cartao rotulo="Comissão" valor={formatarReais(d.comissao30)} />
          <Cartao rotulo="Fraldas" valor={formatarNumero(d.fraldas30)} />
          <Cartao
            rotulo="Novos"
            valor={`${formatarNumero(p.novas30)} páginas`}
            detalhe={`${formatarNumero(u.novos30)} usuários`}
          />
        </div>
        <GraficoDiario dias={dias} />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Recentes titulo="Páginas criadas" href="/admin/paginas" vazio="Nenhuma página ainda.">
          {recente.paginas.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="grid min-w-0">
                <Link href={`/admin/paginas/${r.id}`} className="truncate font-semibold hover:text-brand">
                  {r.nomeBebe}
                </Link>
                <span className="truncate text-sm text-muted">
                  {r.dono ?? "sem dono"} · {STATUS_PAGINA[r.status]}
                </span>
              </span>
              <span className="text-sm whitespace-nowrap text-muted tabular-nums">{formatarDataHora(r.createdAt)}</span>
            </li>
          ))}
        </Recentes>
        <Recentes titulo="Doações pagas" href="/admin/doacoes?status=paga" vazio="Nenhuma doação paga ainda.">
          {recente.doacoes.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="grid min-w-0">
                <span className="truncate font-semibold">
                  {r.nomeConvidado} · {formatarReais(r.valorCentavos)}
                </span>
                <Link href={`/admin/paginas/${r.paginaId}`} className="truncate text-sm text-muted hover:text-brand">
                  {formatarNumero(r.fraldas)} fraldas para {r.nomeBebe}
                </Link>
              </span>
              <span className="text-sm whitespace-nowrap text-muted tabular-nums">{formatarDataHora(r.pagoEm)}</span>
            </li>
          ))}
        </Recentes>
      </section>

      <section className="grid gap-3">
        <h2 className="titulo text-xl">Desde o começo</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Cartao rotulo="Arrecadado" valor={formatarReais(d.arrecadado)} detalhe={`${formatarNumero(d.pagas)} doações`} />
          <Cartao
            rotulo="Comissão"
            valor={formatarReais(d.comissao)}
            detalhe={d.pagas ? `${pct(d.cobriramTaxa, d.pagas)} dos convidados cobriram` : undefined}
          />
          <Cartao rotulo="Para as famílias" valor={formatarReais(d.arrecadado - d.comissao)} detalhe="antes da taxa do Mercado Pago" />
          <Cartao
            rotulo="Fraldas"
            valor={formatarNumero(d.fraldas)}
            detalhe={d.pagas ? `média de ${formatarReais(Math.round(d.arrecadado / d.pagas))} por doação` : undefined}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Lista
          titulo={`Páginas (${formatarNumero(p.total)})`}
          itens={[
            ["No ar", p.noAr],
            ["Rascunho", p.rascunho],
            ["Encerrada", p.encerrada],
            ["Suspensa", p.suspensa],
          ]}
        />
        <Cartao
          rotulo="Contas conectadas"
          valor={formatarNumero(c.total)}
          detalhe={`Mercado Pago · ${formatarNumero(c.novas30)} nos últimos 30 dias`}
        />
        <Lista
          titulo={`Pix gerados (${formatarNumero(d.gerados)})`}
          itens={[
            ["Pagos", d.pagas],
            ["Aguardando", d.aguardando],
            ["Expirados", d.expiradas],
            ["Devolvidos", d.devolvidas],
          ]}
        />
        <div className="grid content-start gap-3">
          <Cartao rotulo="Conversão do Pix" valor={pct(d.pagas, concluidos)} detalhe="pagos entre os já concluídos" />
          <Cartao
            rotulo="Webhooks do Mercado Pago"
            valor={formatarNumero(w.total)}
            detalhe={w.pendentes ? `${formatarNumero(w.pendentes)} sem processar` : "todos processados"}
          />
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="titulo text-xl">Páginas com mais fraldas</h2>
        {maiores.length === 0 ? (
          <p className="text-muted">Nenhuma doação paga ainda.</p>
        ) : (
          <ol className="grid divide-y divide-line cartao">
            {maiores.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
                <span className="grid">
                  <Link href={`/admin/paginas/${m.id}`} className="font-semibold hover:text-brand">
                    {m.nomeBebe}
                  </Link>
                  <span className="text-sm text-muted">
                    /{m.slug} · {STATUS_PAGINA[m.status]}
                  </span>
                </span>
                <span className="text-sm tabular-nums">
                  <strong>{formatarNumero(m.fraldas)}</strong> de {formatarNumero(m.metaFraldas)} fraldas ·{" "}
                  {formatarNumero(m.doadores)} doadores
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Recentes({ titulo, href, vazio, children }: { titulo: string; href: string; vazio: string; children: React.ReactNode[] }) {
  return (
    <div className="grid content-start gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="titulo text-xl">{titulo}</h2>
        <Link href={href} className="text-sm font-semibold hover:text-brand">
          Ver todas
        </Link>
      </div>
      {children.length === 0 ? (
        <p className="text-muted">{vazio}</p>
      ) : (
        <ul className="grid divide-y divide-line cartao">{children}</ul>
      )}
    </div>
  );
}
