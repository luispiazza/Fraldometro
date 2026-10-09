import Link from "next/link";
import { Abas, Busca, param, Progresso, Selo, STATUS_PAGINA } from "@/components/numeros";
import { listarPaginas, type StatusPagina } from "@/lib/admin";
import { exigirAdmin } from "@/lib/auth";
import { formatarNumero, formatarReais } from "@/lib/dinheiro";
import { formatarDataHora } from "@/lib/pagina";

const FILTROS: [string, string][] = [["", "Todas"], ...Object.entries(STATUS_PAGINA)];

export default async function AdminPaginas({ searchParams }: PageProps<"/admin/paginas">) {
  await exigirAdmin();
  const sp = await searchParams;
  const status = param(sp.status);
  const busca = param(sp.q);
  const paginas = await listarPaginas({
    status: status && status in STATUS_PAGINA ? (status as StatusPagina) : undefined,
    busca,
  });

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12">
      <h1 className="titulo text-4xl leading-tight">Páginas</h1>
      <div className="grid gap-3">
        <Abas base="/admin/paginas" atual={status ?? ""} opcoes={FILTROS} />
        <Busca busca={busca} status={status} dica="Bebê, link, dono ou e-mail" />
      </div>

      <p className="text-sm text-muted">{formatarNumero(paginas.length)} páginas{paginas.length === 200 && " (mostrando as 200 mais novas)"}</p>

      {paginas.length > 0 && (
        <ul className="grid divide-y divide-line cartao">
          {paginas.map((p) => (
            <li key={p.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_220px_120px] sm:items-center">
              <span className="grid min-w-0 gap-0.5">
                <span className="flex items-center gap-2">
                  <Link href={`/admin/paginas/${p.id}`} className="truncate font-semibold hover:text-brand">
                    {p.nomeBebe}
                  </Link>
                  <Selo status={p.status} texto={STATUS_PAGINA[p.status]} />
                </span>
                <span className="truncate text-sm text-muted">
                  /{p.slug} · {p.dono ?? "sem dono"} · criada {formatarDataHora(p.createdAt)}
                </span>
                {!p.contaConectada && <span className="text-sm text-muted">Mercado Pago não conectado</span>}
              </span>
              <Progresso total={p.fraldas} meta={p.metaFraldas} />
              <span className="grid text-sm sm:text-right">
                <strong className="tabular-nums">{formatarReais(p.arrecadado)}</strong>
                <span className="text-muted">{formatarNumero(p.doadores)} doadores</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
