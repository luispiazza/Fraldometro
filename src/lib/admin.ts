import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { donations, pages, pageTotals, payoutAccounts, users, webhookEvents } from "@/db/schema";

// Números da visão geral do /admin. Tudo vem do banco: só doações "pagas" contam como dinheiro.

const ULTIMOS_30 = sql`now() - interval '30 days'`;
const int = (expr: ReturnType<typeof sql>) => sql<number>`(${expr})::int`;

export async function numerosDoAdmin() {
  const pago = sql`${donations.status} = 'paga'`;
  const pago30 = sql`${pago} and ${donations.pagoEm} >= ${ULTIMOS_30}`;

  const [[doacoes], [paginas], [contas], [usuarios], [webhooks], maiores] = await Promise.all([
    db
      .select({
        arrecadado: int(sql`coalesce(sum(${donations.valorCentavos}) filter (where ${pago}), 0)`),
        comissao: int(sql`coalesce(sum(${donations.comissaoCentavos}) filter (where ${pago}), 0)`),
        fraldas: int(sql`coalesce(sum(${donations.fraldas}) filter (where ${pago}), 0)`),
        pagas: int(sql`count(*) filter (where ${pago})`),
        arrecadado30: int(sql`coalesce(sum(${donations.valorCentavos}) filter (where ${pago30}), 0)`),
        comissao30: int(sql`coalesce(sum(${donations.comissaoCentavos}) filter (where ${pago30}), 0)`),
        fraldas30: int(sql`coalesce(sum(${donations.fraldas}) filter (where ${pago30}), 0)`),
        pagas30: int(sql`count(*) filter (where ${pago30})`),
        cobriramTaxa: int(sql`count(*) filter (where ${pago} and ${donations.cobriuTaxa})`),
        aguardando: int(sql`count(*) filter (where ${donations.status} = 'aguardando')`),
        expiradas: int(sql`count(*) filter (where ${donations.status} = 'expirada')`),
        devolvidas: int(sql`count(*) filter (where ${donations.status} = 'devolvida')`),
        gerados: int(sql`count(*)`),
      })
      .from(donations),
    db
      .select({
        total: int(sql`count(*)`),
        rascunho: int(sql`count(*) filter (where ${pages.status} = 'rascunho')`),
        noAr: int(sql`count(*) filter (where ${pages.status} = 'no_ar')`),
        encerrada: int(sql`count(*) filter (where ${pages.status} = 'encerrada')`),
        suspensa: int(sql`count(*) filter (where ${pages.status} = 'suspensa')`),
        novas30: int(sql`count(*) filter (where ${pages.createdAt} >= ${ULTIMOS_30})`),
      })
      .from(pages),
    db
      .select({
        total: int(sql`count(*)`),
        novas30: int(sql`count(*) filter (where ${payoutAccounts.createdAt} >= ${ULTIMOS_30})`),
      })
      .from(payoutAccounts),
    db
      .select({
        total: int(sql`count(*)`),
        novos30: int(sql`count(*) filter (where ${users.createdAt} >= ${ULTIMOS_30})`),
      })
      .from(users),
    db
      .select({
        total: int(sql`count(*)`),
        pendentes: int(sql`count(*) filter (where ${webhookEvents.processadoEm} is null)`),
      })
      .from(webhookEvents),
    db
      .select({
        id: pages.id,
        slug: pages.slug,
        nomeBebe: pages.nomeBebe,
        status: pages.status,
        metaFraldas: pages.metaFraldas,
        fraldas: pageTotals.totalFraldas,
        doadores: pageTotals.doadores,
      })
      .from(pageTotals)
      .innerJoin(pages, eq(pages.id, pageTotals.pageId))
      .orderBy(desc(pageTotals.totalFraldas))
      .limit(5),
  ]);

  return { doacoes, paginas, contas, usuarios, webhooks, maiores };
}
