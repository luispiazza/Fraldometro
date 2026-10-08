import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/marca";
import { db } from "@/db";
import { donations, pages } from "@/db/schema";
import { formatarNumero, formatarReais } from "@/lib/dinheiro";
import { contracao } from "@/lib/pagina";
import { emTeste, type Pagamento } from "@/lib/mercadopago";
import { conciliarPagamento, contaDaPagina } from "@/lib/pagamentos";
import { isTema, TEMA_PADRAO } from "@/themes";
import { simularPagamento } from "../../acoes-doacao";
import { Aguardando, CopiaECola } from "./aguardando";

export const metadata: Metadata = { title: "Pix da doação", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// O Pix de uma doação: QR Code e copia e cola enquanto espera, agradecimento quando cai.
export default async function PixDaDoacao({ params }: PageProps<"/[slug]/doacao/[id]">) {
  const { slug, id } = await params;
  if (!UUID.test(id)) notFound();

  const [linha] = await db
    .select({ doacao: donations, pagina: pages })
    .from(donations)
    .innerJoin(pages, eq(pages.id, donations.pageId))
    .where(and(eq(donations.id, id), eq(pages.slug, slug)))
    .limit(1);
  if (!linha) notFound();
  const { pagina } = linha;
  const conta = await contaDaPagina(pagina.id);
  if (!conta) notFound();

  // Enquanto espera, a mesma consulta traz o status e o QR Code.
  let doacao = linha.doacao;
  let pagamento: Pagamento | null = null;
  if (doacao.status === "aguardando") {
    try {
      ({ doacao, pagamento } = await conciliarPagamento(doacao, conta));
    } catch (e) {
      console.error("Mercado Pago: consulta do Pix", e);
    }
  }
  const pix = pagamento?.point_of_interaction?.transaction_data;
  const de = contracao(pagina.sexo);

  return (
    <div data-tema={isTema(pagina.tema) ? pagina.tema : TEMA_PADRAO} className="tema min-h-full flex-1">
      <div className="mx-auto grid max-w-[560px] gap-6 px-5 py-7">
        <header className="flex items-center justify-between gap-3 text-[13px] text-[var(--t-muted)]">
          <Link href="/" className="text-base text-[var(--t-fg)]">
            <Logo />
          </Link>
          <Link href={`/${pagina.slug}`}>
            Chá {de} {pagina.nomeBebe}
          </Link>
        </header>

        <div className="tema-card grid gap-4 p-[22px]">
          {doacao.status === "paga" ? (
            <>
              <h1 className="tema-display text-[clamp(26px,5vw,36px)] leading-tight">
                Obrigado, {doacao.nomeConvidado.split(" ")[0]}!
              </h1>
              <p>
                Suas {formatarNumero(doacao.fraldas)} fraldas já estão no fraldômetro {de} {pagina.nomeBebe}.
              </p>
              <Link href={`/${pagina.slug}`} className="tema-cta tema-display justify-self-start px-[22px] py-[13px] text-base leading-none">
                Ver o fraldômetro
              </Link>
            </>
          ) : doacao.status === "aguardando" ? (
            <>
              <h1 className="tema-display text-[clamp(24px,5vw,32px)] leading-tight">
                Pague {formatarReais(doacao.valorCentavos)} via Pix
              </h1>
              <p className="text-[var(--t-muted)]">
                {formatarNumero(doacao.fraldas)} fraldas para {pagina.nomeBebe}. O Pix vai para {conta.titular}, na conta
                Mercado Pago da família. Esta tela atualiza sozinha quando o pagamento cair.
              </p>
              {pix?.qr_code && pix.qr_code_base64 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem em base64 vinda do Mercado Pago */}
                  <img
                    src={`data:image/png;base64,${pix.qr_code_base64}`}
                    alt="QR Code do Pix"
                    width={240}
                    height={240}
                    className="justify-self-center rounded-lg bg-white p-2"
                  />
                  <CopiaECola codigo={pix.qr_code} />
                </>
              ) : (
                <p role="alert">Não conseguimos carregar o QR Code. Recarregue a página em instantes.</p>
              )}
              <Aguardando id={doacao.id} />
              {emTeste() && (
                <form action={simularPagamento.bind(null, doacao.id)}>
                  <button className="text-sm underline">Simular pagamento (teste)</button>
                </form>
              )}
            </>
          ) : (
            <>
              <h1 className="tema-display text-[clamp(24px,5vw,32px)] leading-tight">
                {doacao.status === "devolvida" ? "Este Pix foi devolvido" : "Este Pix venceu"}
              </h1>
              <Link href={`/${pagina.slug}`} className="tema-cta tema-display justify-self-start px-[22px] py-[13px] text-base leading-none">
                Fazer uma nova doação
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
