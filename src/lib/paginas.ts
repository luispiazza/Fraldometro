import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { donations, pageMembers, pages, pageTotals } from "@/db/schema";
import type { DadosPagina } from "@/components/pagina-do-bebe";
import { formatarData, formatarMes, urlDaFoto } from "@/lib/pagina";
import { isTema, TEMA_PADRAO } from "@/themes";

export type Pagina = typeof pages.$inferSelect;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A página, se o usuário for dono ou coeditor dela; senão null. */
export async function paginaDoMembro(id: string, userId: string): Promise<Pagina | null> {
  if (!UUID.test(id)) return null;
  const [linha] = await db
    .select({ pagina: pages })
    .from(pages)
    .innerJoin(pageMembers, and(eq(pageMembers.pageId, pages.id), eq(pageMembers.userId, userId)))
    .where(eq(pages.id, id))
    .limit(1);
  return linha?.pagina ?? null;
}

/** A página no ar com esse endereço, para os convidados. */
export async function paginaNoAr(slug: string): Promise<Pagina | null> {
  const [pagina] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.status, "no_ar")))
    .limit(1);
  return pagina ?? null;
}

/** Junta a página com o total de fraldas pagas, no formato que a tela usa. */
export async function dadosParaExibir(pagina: Pagina): Promise<DadosPagina> {
  const [totais] = await db.select().from(pageTotals).where(eq(pageTotals.pageId, pagina.id)).limit(1);
  return {
    nomeBebe: pagina.nomeBebe,
    sexo: pagina.sexo,
    jaNasceu: pagina.jaNasceu,
    tema: isTema(pagina.tema) ? pagina.tema : TEMA_PADRAO,
    chegada: formatarMes(pagina.mesPrevisto),
    recado: pagina.recado,
    encerraEm: formatarData(pagina.encerraEm),
    fotoUrl: urlDaFoto(pagina.fotoPath),
    metaFraldas: pagina.metaFraldas,
    valorFraldaCentavos: pagina.valorFraldaCentavos,
    totalFraldas: totais?.totalFraldas ?? 0,
    doadores: totais?.doadores ?? 0,
  };
}

// Para os pais, "recebido" é o que cai na conta deles: o valor pago menos a comissão
// (antes da taxa do Mercado Pago, que aparece no extrato de lá).
const paga = sql`${donations.status} = 'paga'`;
const recebido = sql<number>`coalesce(sum(${donations.valorCentavos} - ${donations.comissaoCentavos}) filter (where ${paga}), 0)::int`;

/** As páginas do usuário, com fraldas e valor recebido de cada uma. */
export async function paginasDoUsuario(userId: string) {
  return db
    .select({
      id: pages.id,
      slug: pages.slug,
      nomeBebe: pages.nomeBebe,
      status: pages.status,
      metaFraldas: pages.metaFraldas,
      fraldas: sql<number>`coalesce(sum(${donations.fraldas}) filter (where ${paga}), 0)::int`,
      doadores: sql<number>`count(${donations.id}) filter (where ${paga})::int`,
      recebido,
    })
    .from(pageMembers)
    .innerJoin(pages, eq(pages.id, pageMembers.pageId))
    .leftJoin(donations, eq(donations.pageId, pages.id))
    .where(eq(pageMembers.userId, userId))
    .groupBy(pages.id)
    .orderBy(pages.createdAt);
}

/** Números da página para o painel da família. */
export async function resumoDaPagina(pageId: string) {
  const [resumo] = await db
    .select({
      fraldas: sql<number>`coalesce(sum(${donations.fraldas}) filter (where ${paga}), 0)::int`,
      doadores: sql<number>`count(*) filter (where ${paga})::int`,
      recebido,
      fraldas7: sql<number>`coalesce(sum(${donations.fraldas}) filter (where ${paga} and ${donations.pagoEm} >= now() - interval '7 days'), 0)::int`,
      aguardando: sql<number>`count(*) filter (where ${donations.status} = 'aguardando')::int`,
    })
    .from(donations)
    .where(eq(donations.pageId, pageId));
  return resumo;
}

/** Doações pagas, da mais recente para a mais antiga: quem doou, quanto e o recado. */
export async function doacoesPagas(pageId: string) {
  return db
    .select({
      id: donations.id,
      nome: donations.nomeConvidado,
      recado: donations.recado,
      fraldas: donations.fraldas,
      recebido: sql<number>`(${donations.valorCentavos} - ${donations.comissaoCentavos})::int`,
      pagoEm: donations.pagoEm,
    })
    .from(donations)
    .where(and(eq(donations.pageId, pageId), paga))
    .orderBy(desc(donations.pagoEm));
}
