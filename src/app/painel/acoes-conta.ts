"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages, payoutAccounts } from "@/db/schema";
import { exigirPerfil } from "@/lib/auth";
import { COOKIE_OAUTH, urlDeAutorizacao } from "@/lib/mercadopago";
import { contaDaPagina } from "@/lib/pagamentos";
import { paginaDoMembro } from "@/lib/paginas";

// Conexão da conta Mercado Pago da família e publicação da página.
// A família entra no Mercado Pago e autoriza o Fraldômetro; a volta cai em
// /painel/mercadopago/retorno, que confere o cookie abaixo.

export type EstadoConta = { erro?: string; aviso?: string };

async function paginaDoUsuario(id: string) {
  const perfil = await exigirPerfil();
  return paginaDoMembro(id, perfil.id);
}

/** Leva ao Mercado Pago. O `state` aleatório volta na resposta e precisa bater com o cookie. */
export async function conectarMercadoPago(pageId: string): Promise<void> {
  const pagina = await paginaDoUsuario(pageId);
  if (!pagina) return;
  const estado = randomBytes(24).toString("base64url");
  (await cookies()).set(COOKIE_OAUTH, `${estado}.${pageId}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/painel/mercadopago",
    maxAge: 15 * 60,
  });
  redirect(urlDeAutorizacao(estado));
}

/** Troca a conta conectada. Só antes de publicar, para não perder o rastro dos Pix já gerados. */
export async function desconectarConta(pageId: string): Promise<void> {
  const pagina = await paginaDoUsuario(pageId);
  if (!pagina || pagina.status !== "rascunho") return;
  await db.delete(payoutAccounts).where(eq(payoutAccounts.pageId, pageId));
  revalidatePath(`/painel/paginas/${pageId}`, "layout");
}

export async function publicarPagina(pageId: string): Promise<EstadoConta> {
  const pagina = await paginaDoUsuario(pageId);
  if (!pagina) return { erro: "Você não tem acesso a esta página." };
  if (!(await contaDaPagina(pageId))) return { erro: "Conecte a conta Mercado Pago da família antes de publicar." };
  if (pagina.status !== "rascunho") return {};
  await db.update(pages).set({ status: "no_ar" }).where(eq(pages.id, pageId));
  revalidatePath("/painel", "layout");
  revalidatePath(`/${pagina.slug}`);
  return { aviso: "Página no ar!" };
}
