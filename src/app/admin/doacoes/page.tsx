import Link from "next/link";
import { Abas, Busca, param, Selo, STATUS_DOACAO } from "@/components/numeros";
import { listarDoacoes, type StatusDoacao } from "@/lib/admin";
import { exigirAdmin } from "@/lib/auth";
import { formatarNumero, formatarReais } from "@/lib/dinheiro";
import { formatarDataHora } from "@/lib/pagina";

const FILTROS: [string, string][] = [["", "Todas"], ...Object.entries(STATUS_DOACAO)];

export default async function AdminDoacoes({ searchParams }: PageProps<"/admin/doacoes">) {
  await exigirAdmin();
  const sp = await searchParams;
  const status = param(sp.status);
  const busca = param(sp.q);
  const doacoes = await listarDoacoes({
    status: status && status in STATUS_DOACAO ? (status as StatusDoacao) : undefined,
    busca,
  });

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12">
      <h1 className="titulo text-4xl leading-tight">Doações</h1>
      <div className="grid gap-3">
        <Abas base="/admin/doacoes" atual={status ?? ""} opcoes={FILTROS} />
        <Busca busca={busca} status={status} dica="Convidado, bebê ou link" />
      </div>

      <p className="text-sm text-muted">{formatarNumero(doacoes.length)} Pix{doacoes.length === 200 && " (mostrando os 200 mais novos)"}</p>

      {doacoes.length > 0 && (
        <ul className="grid divide-y divide-line cartao">
          {doacoes.map((d) => (
            <li key={d.id} className="grid gap-1 px-5 py-3">
              <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span className="flex items-center gap-2 font-semibold">
                  {d.nomeConvidado} <Selo status={d.status} texto={STATUS_DOACAO[d.status]} />
                </span>
                <span className="text-sm tabular-nums">
                  <strong>{formatarReais(d.valorCentavos)}</strong>
                  <span className="text-muted"> · comissão {formatarReais(d.comissaoCentavos)}</span>
                </span>
              </span>
              <span className="text-sm text-muted">
                {formatarNumero(d.fraldas)} fraldas para{" "}
                <Link href={`/admin/paginas/${d.paginaId}`} className="font-semibold text-fg hover:text-brand">
                  {d.nomeBebe}
                </Link>
                {d.recado && ` · “${d.recado}”`}
              </span>
              <span className="text-xs text-muted tabular-nums">
                gerado {formatarDataHora(d.createdAt)}
                {d.pagoEm && ` · pago ${formatarDataHora(d.pagoEm)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
