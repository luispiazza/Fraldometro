import { Busca, param, Selo } from "@/components/numeros";
import { listarUsuarios } from "@/lib/admin";
import { exigirAdmin } from "@/lib/auth";
import { formatarNumero } from "@/lib/dinheiro";
import { formatarDataHora } from "@/lib/pagina";

export default async function AdminUsuarios({ searchParams }: PageProps<"/admin/usuarios">) {
  await exigirAdmin();
  const busca = param((await searchParams).q);
  const usuarios = await listarUsuarios({ busca });

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-12">
      <h1 className="titulo text-4xl leading-tight">Usuários</h1>
      <Busca busca={busca} dica="Nome ou e-mail" />

      <p className="text-sm text-muted">{formatarNumero(usuarios.length)} usuários{usuarios.length === 200 && " (mostrando os 200 mais novos)"}</p>

      {usuarios.length > 0 && (
        <ul className="grid divide-y divide-line cartao">
          {usuarios.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
              <span className="grid min-w-0">
                <span className="flex items-center gap-2 font-semibold">
                  {u.nome} {u.admin && <Selo status="admin" texto="admin" />}
                </span>
                <span className="truncate text-sm text-muted">
                  {u.email}
                  {u.whatsapp && ` · ${u.whatsapp}`}
                  {!u.aceitaAvisos && " · não quer avisos"}
                </span>
              </span>
              <span className="grid text-sm sm:text-right">
                <span className="tabular-nums">
                  {u.paginas === 0
                    ? "sem página"
                    : `${formatarNumero(u.paginas)} ${u.paginas === 1 ? "página" : "páginas"} · ${formatarNumero(u.paginasNoAr)} no ar`}
                </span>
                <span className="text-muted tabular-nums">desde {formatarDataHora(u.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
