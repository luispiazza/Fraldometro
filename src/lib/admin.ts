import "server-only";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { admins, donations, pageMembers, pages, pageTotals, payoutAccounts, users, webhookEvents } from "@/db/schema";

// Números da visão geral do /admin. Tudo vem do banco: só doações "pagas" contam como dinheiro.

const ULTIMOS_30 = sql`now() - interval '30 days'`;
const int = (expr: ReturnType<typeof sql>) => sql<number>`(${expr})::int`;

export async function numerosDoAdmin() {
  const pago = sql`${donations.status} = 'paga'`;
  const pago30 = sql`${pago} and ${donations.pagoEm} >= ${ULTIMOS_30}`;

  const [[doacoes], [paginas], [contas], [usuarios], [webhooks], maiores, dias] = await Promise.all([
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
    serieDiaria(),
  ]);

  return { doacoes, paginas, contas, usuarios, webhooks, maiores, dias };
}

/** Arrecadado em cada um dos últimos 30 dias (dia de Brasília), com zero nos dias sem doação. */
async function serieDiaria() {
  const linhas = await db.execute<{ dia: string; centavos: number; doacoes: number }>(sql`
    with hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d)
    select to_char(g.dia, 'YYYY-MM-DD') as dia,
           coalesce(sum(${donations.valorCentavos}), 0)::int as centavos,
           count(${donations.id})::int as doacoes
    from hoje, generate_series(hoje.d - 29, hoje.d, interval '1 day') as g(dia)
    left join ${donations}
      on ${donations.status} = 'paga'
     and (${donations.pagoEm} at time zone 'America/Sao_Paulo')::date = g.dia::date
    group by g.dia
    order by g.dia`);
  return [...linhas];
}

// Listas do admin. Limite fixo: por enquanto a plataforma é pequena e a busca resolve o resto.
const LIMITE = 200;

const somaPaga = (coluna: SQL) =>
  int(sql`coalesce((select sum(${coluna}) from ${donations} where ${donations.pageId} = ${pages.id} and ${donations.status} = 'paga'), 0)`);

export type StatusPagina = (typeof pages.$inferSelect)["status"];
export type StatusDoacao = (typeof donations.$inferSelect)["status"];

/** Páginas, das mais novas para as mais antigas, com dono, conta e quanto já arrecadaram. */
export async function listarPaginas({ status, busca, limite = LIMITE }: { status?: StatusPagina; busca?: string; limite?: number }) {
  const filtros = [
    status && eq(pages.status, status),
    busca && or(ilike(pages.nomeBebe, `%${busca}%`), ilike(pages.slug, `%${busca}%`), ilike(users.nome, `%${busca}%`), ilike(users.email, `%${busca}%`)),
  ].filter((f): f is SQL => !!f);

  return db
    .select({
      id: pages.id,
      slug: pages.slug,
      nomeBebe: pages.nomeBebe,
      status: pages.status,
      metaFraldas: pages.metaFraldas,
      createdAt: pages.createdAt,
      dono: users.nome,
      donoEmail: users.email,
      contaConectada: sql<boolean>`${payoutAccounts.id} is not null`,
      fraldas: sql<number>`coalesce(${pageTotals.totalFraldas}, 0)`,
      doadores: sql<number>`coalesce(${pageTotals.doadores}, 0)`,
      arrecadado: somaPaga(sql`${donations.valorCentavos}`),
    })
    .from(pages)
    .leftJoin(pageMembers, and(eq(pageMembers.pageId, pages.id), eq(pageMembers.papel, "dono")))
    .leftJoin(users, eq(users.id, pageMembers.userId))
    .leftJoin(payoutAccounts, eq(payoutAccounts.pageId, pages.id))
    .leftJoin(pageTotals, eq(pageTotals.pageId, pages.id))
    .where(filtros.length ? and(...filtros) : undefined)
    .orderBy(desc(pages.createdAt))
    .limit(limite);
}

/** Tudo de uma página para o admin: membros, conta da família e todas as doações. */
export async function paginaDoAdmin(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [pagina] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!pagina) return null;

  const [membros, [conta], doacoes] = await Promise.all([
    db
      .select({ id: users.id, nome: users.nome, email: users.email, whatsapp: users.whatsapp, papel: pageMembers.papel })
      .from(pageMembers)
      .innerJoin(users, eq(users.id, pageMembers.userId))
      .where(eq(pageMembers.pageId, id)),
    db
      .select({ titular: payoutAccounts.titular, mpUserId: payoutAccounts.mpUserId, createdAt: payoutAccounts.createdAt, expiraEm: payoutAccounts.mpTokenExpiraEm })
      .from(payoutAccounts)
      .where(eq(payoutAccounts.pageId, id)),
    db.select().from(donations).where(eq(donations.pageId, id)).orderBy(desc(donations.createdAt)),
  ]);

  return { pagina, membros, conta: conta ?? null, doacoes };
}

/** Doações (Pix gerados), das mais novas para as mais antigas, com a página de cada uma. */
export async function listarDoacoes({ status, busca }: { status?: StatusDoacao; busca?: string }) {
  const filtros = [
    status && eq(donations.status, status),
    busca && or(ilike(donations.nomeConvidado, `%${busca}%`), ilike(pages.nomeBebe, `%${busca}%`), ilike(pages.slug, `%${busca}%`)),
  ].filter((f): f is SQL => !!f);

  return db
    .select({
      id: donations.id,
      nomeConvidado: donations.nomeConvidado,
      recado: donations.recado,
      fraldas: donations.fraldas,
      valorCentavos: donations.valorCentavos,
      comissaoCentavos: donations.comissaoCentavos,
      cobriuTaxa: donations.cobriuTaxa,
      status: donations.status,
      createdAt: donations.createdAt,
      pagoEm: donations.pagoEm,
      paginaId: pages.id,
      nomeBebe: pages.nomeBebe,
      slug: pages.slug,
    })
    .from(donations)
    .innerJoin(pages, eq(pages.id, donations.pageId))
    .where(filtros.length ? and(...filtros) : undefined)
    .orderBy(desc(donations.createdAt))
    .limit(LIMITE);
}

/** Usuários, dos mais novos para os mais antigos, com quantas páginas têm. */
export async function listarUsuarios({ busca }: { busca?: string }) {
  return db
    .select({
      id: users.id,
      nome: users.nome,
      email: users.email,
      whatsapp: users.whatsapp,
      aceitaAvisos: users.aceitaAvisos,
      createdAt: users.createdAt,
      admin: sql<boolean>`${admins.userId} is not null`,
      paginas: int(sql`(select count(*) from ${pageMembers} where ${pageMembers.userId} = ${users.id})`),
      paginasNoAr: int(
        sql`(select count(*) from ${pageMembers} join ${pages} on ${pages.id} = ${pageMembers.pageId} where ${pageMembers.userId} = ${users.id} and ${pages.status} = 'no_ar')`,
      ),
    })
    .from(users)
    .leftJoin(admins, eq(admins.userId, users.id))
    .where(busca ? or(ilike(users.nome, `%${busca}%`), ilike(users.email, `%${busca}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(LIMITE);
}

/** O que aconteceu por último: páginas criadas e doações pagas. */
export async function atividadeRecente() {
  const [paginas, doacoes] = await Promise.all([
    listarPaginas({ limite: 5 }),
    db
      .select({
        id: donations.id,
        nomeConvidado: donations.nomeConvidado,
        fraldas: donations.fraldas,
        valorCentavos: donations.valorCentavos,
        pagoEm: donations.pagoEm,
        paginaId: pages.id,
        nomeBebe: pages.nomeBebe,
      })
      .from(donations)
      .innerJoin(pages, eq(pages.id, donations.pageId))
      .where(eq(donations.status, "paga"))
      .orderBy(desc(donations.pagoEm))
      .limit(5),
  ]);
  return { paginas, doacoes };
}
