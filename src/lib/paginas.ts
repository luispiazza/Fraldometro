import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pageMembers, pages, pageTotals } from "@/db/schema";
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
