import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { admins, users } from "@/db/schema";
import { criarClienteServidor } from "@/lib/supabase/server";

// Checagem de sessão de verdade, feita em cada página e ação da área logada.
// O proxy só faz a checagem rápida (redireciona quem não tem sessão).

export type Usuario = { id: string; email: string };

/** Quem está logado, pelo JWT da sessão (validado pelo Supabase), ou null. */
export const usuarioAtual = cache(async (): Promise<Usuario | null> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || !claims.email) return null;
  return { id: claims.sub, email: claims.email };
});

export async function exigirUsuario(): Promise<Usuario> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/entrar");
  return usuario;
}

/** O perfil em `users`, que só existe depois que a pessoa completa o cadastro. */
export const perfilAtual = cache(async () => {
  const usuario = await usuarioAtual();
  if (!usuario) return null;
  const [perfil] = await db.select().from(users).where(eq(users.id, usuario.id)).limit(1);
  return perfil ?? null;
});

/** Usuário logado e com cadastro completo; senão manda para a etapa que falta. */
export async function exigirPerfil() {
  await exigirUsuario();
  const perfil = await perfilAtual();
  if (!perfil) redirect("/entrar/perfil");
  return perfil;
}

/** Se o usuário é da equipe do Fraldômetro (tabela `admins`). */
export const ehAdmin = cache(async (userId: string): Promise<boolean> => {
  const [admin] = await db.select().from(admins).where(eq(admins.userId, userId)).limit(1);
  return !!admin;
});

/** Perfil de quem é da equipe. Para os outros, o /admin nem existe (404). */
export async function exigirAdmin() {
  const perfil = await exigirPerfil();
  if (!(await ehAdmin(perfil.id))) notFound();
  return perfil;
}
