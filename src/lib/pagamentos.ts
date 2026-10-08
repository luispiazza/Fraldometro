import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations, payoutAccounts } from "@/db/schema";
import { cifrar, decifrar } from "@/lib/cifra";
import { consultarPagamento, renovarTokens, type StatusPagamento } from "@/lib/mercadopago";

// Regras que valem tanto para o webhook do Mercado Pago quanto para as consultas à API
// (que cobrem o ambiente local, onde o webhook não chega).

export type ContaFamilia = typeof payoutAccounts.$inferSelect;
export type Doacao = typeof donations.$inferSelect;
type StatusDoacao = Doacao["status"];

export async function contaDaPagina(pageId: string): Promise<ContaFamilia | null> {
  const [conta] = await db.select().from(payoutAccounts).where(eq(payoutAccounts.pageId, pageId)).limit(1);
  return conta ?? null;
}

const RENOVAR_ANTES = 30 * 24 * 3600_000;

/** Token de acesso da família. Renova quando faltam menos de 30 dias para vencer (vale 180). */
export async function tokenDaConta(conta: ContaFamilia): Promise<string> {
  if (conta.mpTokenExpiraEm.getTime() - Date.now() > RENOVAR_ANTES) return decifrar(conta.mpAccessTokenCifrado);
  const novos = await renovarTokens(decifrar(conta.mpRefreshTokenCifrado));
  await db
    .update(payoutAccounts)
    .set({
      mpAccessTokenCifrado: cifrar(novos.accessToken),
      mpRefreshTokenCifrado: cifrar(novos.refreshToken),
      mpTokenExpiraEm: novos.expiraEm,
    })
    .where(eq(payoutAccounts.id, conta.id));
  return novos.accessToken;
}

/** Status do pagamento no Mercado Pago → status da doação. null = não muda. */
export function statusDaDoacao(status: StatusPagamento): StatusDoacao | null {
  switch (status) {
    case "approved":
      return "paga";
    case "pending":
    case "in_process":
    case "authorized":
      return "aguardando";
    case "rejected":
    case "cancelled":
      return "expirada";
    case "refunded":
    case "charged_back":
      return "devolvida";
    default:
      // in_mediation: o convidado abriu disputa; fica como está até o Mercado Pago decidir.
      return null;
  }
}

/** Aplica o novo status à doação do pagamento. Devolve a doação atualizada (ou null se não existe). */
export async function aplicarStatusPagamento(pagamentoId: string, status: StatusDoacao | null): Promise<Doacao | null> {
  const [doacao] = await db.select().from(donations).where(eq(donations.gatewayCobrancaId, pagamentoId)).limit(1);
  if (!doacao || !status || status === doacao.status) return doacao ?? null;
  const [nova] = await db
    .update(donations)
    .set({ status, pagoEm: status === "paga" ? (doacao.pagoEm ?? new Date()) : doacao.pagoEm })
    .where(eq(donations.id, doacao.id))
    .returning();
  return nova;
}

/** Busca o pagamento no Mercado Pago (com o token da família) e atualiza a doação. */
export async function conciliarPagamento(doacao: Doacao, conta: ContaFamilia) {
  const pagamento = await consultarPagamento(await tokenDaConta(conta), doacao.gatewayCobrancaId);
  const atualizada = (await aplicarStatusPagamento(doacao.gatewayCobrancaId, statusDaDoacao(pagamento.status))) ?? doacao;
  return { doacao: atualizada, pagamento };
}

/** Confere no Mercado Pago uma doação que ainda espera o Pix. */
export async function conciliarDoacao(doacao: Doacao, conta: ContaFamilia): Promise<Doacao> {
  if (doacao.status !== "aguardando") return doacao;
  return (await conciliarPagamento(doacao, conta)).doacao;
}
