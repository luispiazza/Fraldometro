import Link from "next/link";
import { numerosDoAdmin } from "@/lib/admin";
import { exigirAdmin } from "@/lib/auth";
import { formatarNumero, formatarReais } from "@/lib/dinheiro";

const STATUS_PAGINA = { rascunho: "Rascunho", no_ar: "No ar", encerrada: "Encerrada", suspensa: "Suspensa" };

const pct = (parte: number, todo: number) => (todo ? `${Math.round((parte / todo) * 100)}%` : "—");

function Cartao({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="grid content-start gap-1 rounded-xl border border-line bg-surface p-5">
      <span className="text-sm text-muted">{rotulo}</span>
      <span className="text-2xl font-bold tracking-[-0.02em] tabular-nums">{valor}</span>
      {detalhe && <span className="text-sm text-muted">{detalhe}</span>}
    </div>
  );
}

function Lista({ titulo, itens }: { titulo: string; itens: [string, number][] }) {
  return (
    <div className="grid content-start gap-3 rounded-xl border border-line bg-surface p-5">
      <h3 className="font-semibold">{titulo}</h3>
      <dl className="grid gap-1.5 text-sm">
        {itens.map(([rotulo, n]) => (
          <div key={rotulo} className="flex justify-between gap-4">
            <dt className="text-muted">{rotulo}</dt>
            <dd className="font-semibold tabular-nums">{formatarNumero(n)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function Admin() {
  await exigirAdmin();
  const { doacoes: d, paginas: p, contas: c, usuarios: u, webhooks: w, maiores } = await numerosDoAdmin();
  // Pix que já tiveram desfecho: os que ainda aguardam não entram na conversão.
  const concluidos = d.gerados - d.aguardando;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12">
      <h1 className="text-3xl font-bold tracking-[-0.02em]">Visão geral</h1>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Últimos 30 dias</h2>
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
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Desde o começo</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Cartao rotulo="Arrecadado" valor={formatarReais(d.arrecadado)} detalhe={`${formatarNumero(d.pagas)} doações`} />
          <Cartao
            rotulo="Comissão"
            valor={formatarReais(d.comissao)}
            detalhe={d.pagas ? `${pct(d.cobriramTaxa, d.pagas)} dos convidados cobriram` : undefined}
          />
          <Cartao rotulo="Para as famílias" valor={formatarReais(d.arrecadado - d.comissao)} detalhe="antes da taxa do Asaas" />
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
        <Lista
          titulo={`Contas da família (${formatarNumero(c.total)})`}
          itens={[
            ["Aprovada", c.aprovada],
            ["Em análise", c.emAnalise],
            ["Pendente", c.pendente],
            ["Recusada", c.recusada],
          ]}
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
            rotulo="Webhooks do Asaas"
            valor={formatarNumero(w.total)}
            detalhe={w.pendentes ? `${formatarNumero(w.pendentes)} sem processar` : "todos processados"}
          />
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Páginas com mais fraldas</h2>
        {maiores.length === 0 ? (
          <p className="text-muted">Nenhuma doação paga ainda.</p>
        ) : (
          <ol className="grid divide-y divide-line rounded-xl border border-line bg-surface">
            {maiores.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
                <span className="grid">
                  {m.status === "no_ar" ? (
                    <Link href={`/${m.slug}`} className="font-semibold hover:text-brand">
                      {m.nomeBebe}
                    </Link>
                  ) : (
                    <span className="font-semibold">{m.nomeBebe}</span>
                  )}
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
