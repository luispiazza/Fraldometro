import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { botaoSecundario } from "@/components/campos";
import { documentosPendentes, sandbox, type DocumentoPendente } from "@/lib/asaas";
import { exigirPerfil } from "@/lib/auth";
import { chaveDaConta, contaDaPagina, sincronizarConta } from "@/lib/pagamentos";
import { paginaDoMembro } from "@/lib/paginas";
import { abrirConta, aprovarContaSandbox, confirmarCpf } from "../../../acoes-conta";
import { FormConta, FormCpf } from "../../../form-conta";

export const metadata: Metadata = { title: "Conta da família" };

const SITUACAO = {
  pendente: "Falta enviar os documentos",
  em_analise: "Documentos em análise",
  aprovada: "Conta aprovada",
  recusada: "Verificação recusada",
} as const;

export default async function ContaDaFamilia({ params }: PageProps<"/painel/paginas/[id]/conta">) {
  const perfil = await exigirPerfil();
  const { id } = await params;
  const pagina = await paginaDoMembro(id, perfil.id);
  if (!pagina) notFound();

  const conta = await contaDaPagina(id);
  const voltar = (
    <Link href={`/painel/paginas/${id}`} className="justify-self-start text-sm text-muted hover:text-fg">
      ← {pagina.nomeBebe}
    </Link>
  );

  if (!conta) {
    return (
      <div className="mx-auto grid max-w-2xl gap-6 px-4 py-12">
        {voltar}
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold tracking-[-0.02em]">Conta da família</h1>
          <p className="text-muted">
            É para essa conta que vai o Pix dos convidados. O nome de quem recebe aparece no Pix, e o saque vai para a
            chave Pix que vocês escolherem.
          </p>
        </div>
        <FormConta acao={abrirConta.bind(null, id)} nomeInicial={perfil.nome} />
      </div>
    );
  }

  // A situação muda no Asaas; o webhook avisa, mas confere aqui também (no Mac o webhook não chega).
  let status = conta.statusVerificacao;
  let documentos: DocumentoPendente[] = [];
  let falhou = false;
  try {
    status = await sincronizarConta(conta);
    if (status !== "aprovada") {
      documentos = (await documentosPendentes(chaveDaConta(conta))).filter((d) => d.status !== "APPROVED" && d.status !== "IGNORED");
    }
  } catch (e) {
    console.error("Asaas: situação da conta", e);
    falhou = true;
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-12">
      {voltar}
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Conta da família</h1>
        <p className="text-muted">Em nome de {conta.titular}.</p>
      </div>

      <section className="grid gap-3 rounded-xl border border-line bg-surface p-5">
        <span className="justify-self-start rounded-full bg-chip px-3 py-1 text-sm font-semibold">{SITUACAO[status]}</span>
        {falhou && <p className="text-sm text-muted">Não deu para consultar o parceiro de pagamentos agora.</p>}
        {status === "aprovada" && (
          <p className="text-sm">
            Tudo certo para receber.{" "}
            {pagina.status === "rascunho" && (
              <Link href={`/painel/paginas/${id}`} className="font-semibold underline">
                Publicar a página
              </Link>
            )}
          </p>
        )}
        {status === "recusada" && (
          <p className="text-sm">O parceiro de pagamentos recusou a verificação. Confira os documentos abaixo e envie de novo.</p>
        )}
        {documentos.length > 0 && (
          <ul className="grid gap-2">
            {documentos.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-3 text-sm">
                <span>
                  <b className="block">{d.title}</b>
                  <span className="text-muted">{d.description}</span>
                </span>
                {d.onboardingUrl ? (
                  <a href={d.onboardingUrl} target="_blank" rel="noreferrer" className={`${botaoSecundario} text-sm`}>
                    Enviar
                  </a>
                ) : (
                  <span className="text-muted">{d.status === "PENDING" ? "Em análise" : "Aguardando link"}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {sandbox() && status !== "aprovada" && (
          <form action={aprovarContaSandbox.bind(null, id)}>
            <button className={`${botaoSecundario} text-sm`}>Aprovar no sandbox</button>
          </form>
        )}
      </section>

      {!conta.gatewayClienteId && (
        <section className="grid gap-3 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Falta um passo</h2>
          <p className="text-sm text-muted">Confirme o CPF de quem recebe para terminar de preparar a conta.</p>
          <FormCpf acao={confirmarCpf.bind(null, id)} />
        </section>
      )}
    </div>
  );
}
