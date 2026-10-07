"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { exigirUsuario, perfilAtual } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoEntrar = { etapa: "email" | "codigo"; email: string; erro?: string; aviso?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Manda o código (e o link de reserva) para o e-mail. Cria a conta se ainda não existir. */
export async function enviarCodigo(_: EstadoEntrar, form: FormData): Promise<EstadoEntrar> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { etapa: "email", email, erro: "Confira o e-mail digitado." };

  const origem = (await headers()).get("origin") ?? "";
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${origem}/auth/confirmar` },
  });

  if (error) {
    const muitos = error.status === 429;
    return {
      etapa: "email",
      email,
      erro: muitos ? "Muitas tentativas. Espere um minuto e tente de novo." : "Não deu para enviar o código agora.",
    };
  }
  return { etapa: "codigo", email };
}

/** Confere o código digitado e abre a sessão. */
export async function confirmarCodigo(estado: EstadoEntrar, form: FormData): Promise<EstadoEntrar> {
  if (form.get("acao") === "reenviar") {
    const novo = await enviarCodigo(estado, form);
    return novo.erro ? { ...novo, etapa: "codigo" } : { ...novo, aviso: "Mandamos um código novo." };
  }

  const email = estado.email;
  const codigo = String(form.get("codigo") ?? "").replace(/\D/g, "");
  if (codigo.length < 6) return { etapa: "codigo", email, erro: "O código tem 6 números." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });
  if (error) return { etapa: "codigo", email, erro: "Código inválido ou vencido. Confira ou peça outro." };

  redirect((await perfilAtual()) ? "/painel" : "/entrar/perfil");
}

export type EstadoPerfil = { erro?: string; salvo?: boolean };

/** Cria ou atualiza o perfil em `users`. Usado no fim do cadastro e na página da conta. */
export async function salvarPerfil(_: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const usuario = await exigirUsuario();
  const nome = String(form.get("nome") ?? "").trim();
  const whatsapp = String(form.get("whatsapp") ?? "").replace(/\D/g, "") || null;
  const aceitaAvisos = form.get("aceitaAvisos") === "on";

  if (nome.length < 2) return { erro: "Diga como podemos chamar você." };
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 13)) return { erro: "Confira o WhatsApp, com DDD." };

  const jaTinha = await perfilAtual();
  await db
    .insert(users)
    .values({ id: usuario.id, email: usuario.email, nome, whatsapp, aceitaAvisos })
    .onConflictDoUpdate({ target: users.id, set: { nome, whatsapp, aceitaAvisos, email: usuario.email } });

  if (!jaTinha) redirect("/painel");
  return { salvo: true };
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
