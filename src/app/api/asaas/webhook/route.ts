import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { payoutAccounts, webhookEvents } from "@/db/schema";
import type { SituacaoAsaas } from "@/lib/asaas";
import { aplicarStatusCobranca, atualizarVerificacao, statusDaDoacao } from "@/lib/pagamentos";

// Avisos do Asaas (configurados em cada subconta na criação, ver src/lib/asaas.ts).
//
// - O token vem no cabeçalho asaas-access-token e precisa bater com ASAAS_WEBHOOK_TOKEN.
// - Todo evento fica em webhook_events; o id do evento é único, então um aviso repetido não conta duas vezes.
// - Só a resposta 200 conta como entregue. Se o processamento falhar, respondemos 500 e o Asaas
//   reenvia (a fila pausa depois de 15 falhas seguidas).

type Evento = {
  id: string;
  event: string;
  account?: { id?: string };
  payment?: { id: string; status: string; deleted?: boolean };
};

function tokenValido(recebido: string | null): boolean {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

const SITUACAO = /^ACCOUNT_STATUS_GENERAL_APPROVAL_(APPROVED|AWAITING_APPROVAL|PENDING|REJECTED)$/;

async function processar(evento: Evento) {
  if (evento.payment && evento.event.startsWith("PAYMENT_")) {
    await aplicarStatusCobranca(evento.payment.id, statusDaDoacao(evento.payment.status, evento.payment.deleted));
    return;
  }
  const situacao = evento.event.match(SITUACAO)?.[1] as SituacaoAsaas | undefined;
  if (situacao && evento.account?.id) {
    const [conta] = await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.gatewaySubcontaId, evento.account.id))
      .limit(1);
    if (conta) await atualizarVerificacao(conta, situacao);
  }
}

export async function POST(request: Request) {
  if (!tokenValido(request.headers.get("asaas-access-token"))) {
    return new Response("token inválido", { status: 401 });
  }

  const evento = (await request.json().catch(() => null)) as Evento | null;
  if (!evento?.id || !evento.event) return new Response("evento inválido", { status: 400 });

  await db
    .insert(webhookEvents)
    .values({ gatewayEventoId: evento.id, tipo: evento.event, conteudo: evento })
    .onConflictDoNothing();
  const [salvo] = await db.select().from(webhookEvents).where(eq(webhookEvents.gatewayEventoId, evento.id)).limit(1);
  if (salvo.processadoEm) return new Response("ok");

  try {
    await processar(evento);
  } catch (e) {
    console.error("webhook do Asaas", evento.id, e);
    return new Response("erro ao processar", { status: 500 });
  }
  await db.update(webhookEvents).set({ processadoEm: new Date() }).where(eq(webhookEvents.id, salvo.id));
  return new Response("ok");
}
