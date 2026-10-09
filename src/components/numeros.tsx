import Link from "next/link";
import { formatarNumero, formatarReais } from "@/lib/dinheiro";

// Peças dos painéis (família e admin): cartões de número, listas, barra de progresso e gráfico.

export const STATUS_PAGINA = { rascunho: "Rascunho", no_ar: "No ar", encerrada: "Encerrada", suspensa: "Suspensa" };
export const STATUS_DOACAO = { aguardando: "Aguardando", paga: "Paga", expirada: "Expirada", devolvida: "Devolvida" };

export const pct = (parte: number, todo: number) => (todo ? `${Math.round((parte / todo) * 100)}%` : "—");

export function Cartao({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="grid content-start gap-1 rounded-xl border border-line bg-surface p-5">
      <span className="text-sm text-muted">{rotulo}</span>
      <span className="text-2xl font-bold tracking-[-0.02em] tabular-nums">{valor}</span>
      {detalhe && <span className="text-sm text-muted">{detalhe}</span>}
    </div>
  );
}

export function Lista({ titulo, itens }: { titulo: string; itens: [string, number][] }) {
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

/** Fraldas recebidas sobre a meta. */
export function Progresso({ total, meta }: { total: number; meta: number }) {
  const largura = meta > 0 ? Math.min(100, (total / meta) * 100) : 0;
  return (
    <div className="grid gap-1.5">
      <div className="h-2 overflow-hidden rounded-full bg-chip">
        <div className="h-full rounded-full bg-brand" style={{ width: `${largura}%` }} />
      </div>
      <span className="text-sm text-muted tabular-nums">
        <strong className="text-fg">{formatarNumero(total)}</strong> de {formatarNumero(meta)} fraldas · {pct(total, meta)}
      </span>
    </div>
  );
}

const TOM_STATUS: Record<string, string> = {
  no_ar: "bg-brand/15 text-fg",
  paga: "bg-brand/15 text-fg",
  aguardando: "bg-chip text-muted",
  rascunho: "bg-chip text-muted",
};

/** Selo de status: o texto diz o estado; a cor só destaca o que está ativo. */
export function Selo({ status, texto }: { status: string; texto: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TOM_STATUS[status] ?? "bg-chip text-muted"}`}>
      {texto}
    </span>
  );
}

/** Filtros em abas (links com ?status=...). */
export function Abas({ base, atual, opcoes }: { base: string; atual: string; opcoes: [string, string][] }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm font-semibold">
      {opcoes.map(([valor, rotulo]) => (
        <Link
          key={valor}
          href={valor ? `${base}?status=${valor}` : base}
          className={`rounded-full border px-3.5 py-1.5 ${
            atual === valor ? "border-fg bg-fg text-bg" : "border-line bg-surface hover:border-fg"
          }`}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  );
}

const diaCurto = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });

/**
 * Arrecadado por dia. Barras de uma série só, na cor da marca; o valor de cada dia aparece no
 * hover (e no title, para quem usa teclado ou leitor de tela). Dias sem doação ficam vazios.
 */
export function GraficoDiario({ dias }: { dias: { dia: string; centavos: number; doacoes: number }[] }) {
  const maior = Math.max(1, ...dias.map((d) => d.centavos));
  const total = dias.reduce((s, d) => s + d.centavos, 0);
  const rotulo = (d: (typeof dias)[number]) =>
    `${diaCurto.format(new Date(d.dia))}: ${formatarReais(d.centavos)} · ${formatarNumero(d.doacoes)} doações`;

  return (
    <figure className="grid gap-3 rounded-xl border border-line bg-surface p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">Arrecadado por dia</span>
        <span className="text-sm text-muted tabular-nums">{formatarReais(total)} em 30 dias</span>
      </figcaption>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <span className="pointer-events-none absolute top-1 left-0 text-xs text-muted tabular-nums">
          {formatarReais(maior)}
        </span>
        <ol className="flex h-40 items-end gap-[2px] border-b border-line pt-6">
          {dias.map((d) => (
            <li key={d.dia} className="group relative flex h-full flex-1 items-end" title={rotulo(d)}>
              <div
                className="w-full rounded-t-[4px] bg-brand group-hover:opacity-80"
                style={{ height: d.centavos ? `max(2px, ${(d.centavos / maior) * 100}%)` : 0 }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-fg px-2 py-1 text-xs whitespace-nowrap text-bg group-hover:block">
                {rotulo(d)}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{dias[0] && diaCurto.format(new Date(dias[0].dia))}</span>
        <span>hoje</span>
      </div>
    </figure>
  );
}

/** Busca por texto que mantém o filtro de status (formulário GET, sem JavaScript). */
export function Busca({ busca, status, dica }: { busca?: string; status?: string; dica: string }) {
  return (
    <form className="flex gap-2">
      {status && <input type="hidden" name="status" value={status} />}
      <input
        name="q"
        defaultValue={busca}
        placeholder={dica}
        className="w-full max-w-sm rounded-full border border-line bg-surface px-4 py-2 text-sm outline-none focus:border-fg"
      />
      <button className="rounded-full bg-fg px-4 py-2 text-sm font-semibold text-bg">Buscar</button>
    </form>
  );
}

/** Primeiro valor de um parâmetro da URL. */
export const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
