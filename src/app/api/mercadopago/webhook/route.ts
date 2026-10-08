import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { donations, webhookEvents } from "@/db/schema";
import { assinaturaValida } from "@/lib/mercadopago";
import { conciliarPagamento, contaDaPagina } from "@/lib/pagamentos";

// Avisos do Mercado Pago (o notification_url de cada Pix, ver src/lib/mercadopago.ts).
//
// - O corpo só diz qual pagamento mudou. O status vem sempre da API, com o token da família,
//   então um aviso falso não consegue marcar nada como pago.
// - Com MP_WEBHOOK_SECRET, um aviso assinado precisa ter a assinatura certa.
// - Todo aviso fica em webhook_events; um aviso repetido não é processado de novo.
// - Se o processamento falhar, respondemos 500 e o Mercado Pago reenvia.

type Aviso = { id?: number | string; type?: string; action?: string; data?: { id?: number | string } };

export async function POST(request: NextRequest) {
  const aviso = (await request.json().catch(() => null)) as Aviso | null;
  const tipo = aviso?.type ?? request.nextUrl.searchParams.get("type");
  const pagamentoId = String(aviso?.data?.id ?? request.nextUrl.searchParams.get("data.id") ?? "");
  if (tipo !== "payment" || !pagamentoId) return new Response("ignorado");

  const assinatura = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (process.env.MP_WEBHOOK_SECRET && assinatura && !assinaturaValida(assinatura, requestId, pagamentoId)) {
    return new Response("assinatura inválida", { status: 401 });
  }

  const eventoId = aviso?.id ? String(aviso.id) : `${pagamentoId}:${aviso?.action ?? ""}:${requestId ?? ""}`;
  await db
    .insert(webhookEvents)
    .values({ gatewayEventoId: eventoId, tipo: aviso?.action ?? tipo, conteudo: aviso ?? {} })
    .onConflictDoNothing();
  const [salvo] = await db.select().from(webhookEvents).where(eq(webhookEvents.gatewayEventoId, eventoId)).limit(1);
  if (salvo.processadoEm) return new Response("ok");

  try {
    const [doacao] = await db.select().from(donations).where(eq(donations.gatewayCobrancaId, pagamentoId)).limit(1);
    const conta = doacao && (await contaDaPagina(doacao.pageId));
    if (conta) await conciliarPagamento(doacao, conta);
  } catch (e) {
    console.error("webhook do Mercado Pago", eventoId, e);
    return new Response("erro ao processar", { status: 500 });
  }
  await db.update(webhookEvents).set({ processadoEm: new Date() }).where(eq(webhookEvents.id, salvo.id));
  return new Response("ok");
}
