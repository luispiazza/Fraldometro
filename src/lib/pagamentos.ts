import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations, payoutAccounts } from "@/db/schema";
import { consultarCobranca, garantirChavePix, situacaoDaConta, type SituacaoAsaas, type StatusCobranca } from "@/lib/asaas";
import { decifrar } from "@/lib/cifra";

// Regras que valem tanto para o webhook do Asaas quanto para as consultas à API
// (que cobrem o ambiente local, onde o webhook não chega).

export type ContaFamilia = typeof payoutAccounts.$inferSelect;
export type Doacao = typeof donations.$inferSelect;
type StatusDoacao = Doacao["status"];
type StatusVerificacao = ContaFamilia["statusVerificacao"];

export async function contaDaPagina(pageId: string): Promise<ContaFamilia | null> {
  const [conta] = await db.select().from(payoutAccounts).where(eq(payoutAccounts.pageId, pageId)).limit(1);
  return conta ?? null;
}

export function chaveDaConta(conta: ContaFamilia): string {
  return decifrar(conta.gatewayApiKeyCifrada);
}

const VERIFICACAO: Record<SituacaoAsaas, StatusVerificacao> = {
  PENDING: "pendente",
  AWAITING_APPROVAL: "em_analise",
  APPROVED: "aprovada",
  REJECTED: "recusada",
};

/** Grava a situação da subconta. Na aprovação, cria a chave Pix (sem ela o QR vence no mesmo dia). */
export async function atualizarVerificacao(conta: ContaFamilia, situacao: SituacaoAsaas): Promise<StatusVerificacao> {
  const status = VERIFICACAO[situacao] ?? conta.statusVerificacao;
  if (status === "aprovada" && conta.statusVerificacao !== "aprovada") await garantirChavePix(chaveDaConta(conta));
  if (status !== conta.statusVerificacao) {
    await db.update(payoutAccounts).set({ statusVerificacao: status }).where(eq(payoutAccounts.id, conta.id));
  }
  return status;
}

/** Consulta a situação no Asaas (enquanto não estiver aprovada). */
export async function sincronizarConta(conta: ContaFamilia): Promise<StatusVerificacao> {
  if (conta.statusVerificacao === "aprovada") return "aprovada";
  const { general } = await situacaoDaConta(chaveDaConta(conta));
  return atualizarVerificacao(conta, general);
}

/** Status da cobrança no Asaas → status da doação. null = não muda. */
export function statusDaDoacao(status: StatusCobranca, apagada = false): StatusDoacao | null {
  if (apagada || status === "DELETED") return "expirada";
  switch (status) {
    // Em conta de pessoa física, CONFIRMED pode ficar em bloqueio cautelar por até 72h;
    // se o Pix for devolvido depois, chega REFUNDED e a doação sai do total.
    case "CONFIRMED":
    case "RECEIVED":
      return "paga";
    case "OVERDUE":
      return "expirada";
    case "REFUNDED":
      return "devolvida";
    case "PENDING":
      return "aguardando";
    default:
      return null;
  }
}

/** Aplica o novo status à doação da cobrança. Devolve a doação atualizada (ou null se não existe). */
export async function aplicarStatusCobranca(cobrancaId: string, status: StatusDoacao | null): Promise<Doacao | null> {
  const [doacao] = await db.select().from(donations).where(eq(donations.gatewayCobrancaId, cobrancaId)).limit(1);
  if (!doacao || !status || status === doacao.status) return doacao ?? null;
  const [nova] = await db
    .update(donations)
    .set({ status, pagoEm: status === "paga" ? (doacao.pagoEm ?? new Date()) : doacao.pagoEm })
    .where(eq(donations.id, doacao.id))
    .returning();
  return nova;
}

/** Confere no Asaas uma doação que ainda espera o Pix. */
export async function conciliarDoacao(doacao: Doacao, conta: ContaFamilia): Promise<Doacao> {
  if (doacao.status !== "aguardando") return doacao;
  const cobranca = await consultarCobranca(chaveDaConta(conta), doacao.gatewayCobrancaId);
  return (await aplicarStatusCobranca(doacao.gatewayCobrancaId, statusDaDoacao(cobranca.status, cobranca.deleted))) ?? doacao;
}
