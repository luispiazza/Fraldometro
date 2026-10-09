import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { botao, botaoSecundario, Mensagem } from "@/components/campos";
import { exigirPerfil } from "@/lib/auth";
import { emTeste } from "@/lib/mercadopago";
import { contaDaPagina } from "@/lib/pagamentos";
import { paginaDoMembro } from "@/lib/paginas";
import { conectarMercadoPago, desconectarConta } from "../../../acoes-conta";

export const metadata: Metadata = { title: "Conta da família" };

const ERROS = {
  negado: "A conexão foi cancelada no Mercado Pago. Tente de novo quando quiser.",
  falhou: "Não conseguimos conectar a conta agora. Tente de novo em alguns minutos.",
} as const;

export default async function ContaDaFamilia({ params, searchParams }: PageProps<"/painel/paginas/[id]/conta">) {
  const perfil = await exigirPerfil();
  const { id } = await params;
  const pagina = await paginaDoMembro(id, perfil.id);
  if (!pagina) notFound();

  const busca = await searchParams;
  const erro = ERROS[busca.erro as keyof typeof ERROS];
  const conta = await contaDaPagina(id);

  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-12">
      <Link href={`/painel/paginas/${id}`} className="justify-self-start text-sm text-muted hover:text-fg">
        ← {pagina.nomeBebe}
      </Link>
      <div className="grid gap-2">
        <h1 className="titulo text-4xl leading-tight">Conta da família</h1>
        <p className="text-muted">
          O Pix dos convidados cai direto na conta Mercado Pago de vocês. O Fraldômetro não guarda o dinheiro nem os
          dados bancários.
        </p>
      </div>

      {!conta ? (
        <section className="grid gap-4 cartao p-5">
          <ol className="grid list-decimal gap-2 pl-5 text-sm">
            <li>Entre na conta Mercado Pago de quem vai receber (ou crie uma, é grátis).</li>
            <li>Autorize o Fraldômetro a gerar cobranças Pix em nome de vocês.</li>
            <li>
              Confira se a conta tem uma <b>chave Pix cadastrada</b> no app do Mercado Pago. Sem ela, o Pix não é
              gerado.
            </li>
          </ol>
          <Mensagem erro={erro} />
          <form action={conectarMercadoPago.bind(null, id)}>
            <button className={botao}>Conectar com Mercado Pago</button>
          </form>
          {emTeste() && (
            <p className="text-sm text-muted">
              Ambiente de teste: entre com o usuário vendedor de teste criado no painel do Mercado Pago.
            </p>
          )}
        </section>
      ) : (
        <section className="grid gap-3 cartao p-5">
          <span className="justify-self-start rounded-full bg-chip px-3 py-1 text-sm font-semibold">Conta conectada</span>
          <p className="text-sm">
            Em nome de <b>{conta.titular}</b>. O nome aparece para quem paga o Pix.
          </p>
          {busca.conectada === "1" && <Mensagem aviso="Pronto! A conta foi conectada." />}
          {pagina.status === "rascunho" && (
            <div className="flex flex-wrap gap-2">
              <Link href={`/painel/paginas/${id}`} className={`${botao} text-sm`}>
                Publicar a página
              </Link>
              <form action={desconectarConta.bind(null, id)}>
                <button className={`${botaoSecundario} text-sm`}>Usar outra conta</button>
              </form>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
