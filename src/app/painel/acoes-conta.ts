"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pages, payoutAccounts } from "@/db/schema";
import {
  aprovarNoSandbox,
  criarClienteConvidados,
  criarSubconta,
  ErroAsaas,
  sandbox,
  type DadosTitular,
} from "@/lib/asaas";
import { exigirPerfil } from "@/lib/auth";
import { cifrar } from "@/lib/cifra";
import { cpfValido, digitos } from "@/lib/cpf";
import { reaisParaCentavos } from "@/lib/pagina";
import { paginaDoMembro } from "@/lib/paginas";
import { chaveDaConta, contaDaPagina, sincronizarConta } from "@/lib/pagamentos";

// Abertura da conta da família no Asaas e publicação da página.
// O CPF vai direto para o Asaas e não fica no nosso banco.

export type EstadoConta = { erro?: string; campo?: string; aviso?: string };

type Falha = { erro: string; campo: string };

async function paginaDoUsuario(id: string) {
  const perfil = await exigirPerfil();
  const pagina = await paginaDoMembro(id, perfil.id);
  return { perfil, pagina };
}

function idade(nascimento: string): number {
  const [a, m, d] = nascimento.split("-").map(Number);
  const hoje = new Date();
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos--;
  return anos;
}

function lerTitular(form: FormData, email: string): { dados: DadosTitular } | Falha {
  const texto = (nome: string) => String(form.get(nome) ?? "").trim();
  const falha = (campo: string, erro: string): Falha => ({ campo, erro });

  const nome = texto("nome").replace(/\s+/g, " ");
  // O Asaas trava aprovação e Pix com números ou símbolos no nome.
  if (nome.split(" ").length < 2 || !/^[\p{L}' -]+$/u.test(nome)) {
    return falha("nome", "Escreva o nome completo, como no documento, sem números.");
  }
  const cpf = digitos(texto("cpf"));
  if (!cpfValido(cpf)) return falha("cpf", "Confira o CPF.");
  const nascimento = texto("nascimento");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento) || idade(nascimento) < 18 || idade(nascimento) > 120) {
    return falha("nascimento", "Quem recebe precisa ter 18 anos ou mais.");
  }
  const celular = digitos(texto("celular"));
  if (!/^\d{2}9\d{8}$/.test(celular)) return falha("celular", "Celular com DDD, ex.: (11) 91234-5678.");
  const renda = reaisParaCentavos(texto("renda"));
  if (!(renda > 0)) return falha("renda", "Informe a renda mensal aproximada.");
  const cep = digitos(texto("cep"));
  if (cep.length !== 8) return falha("cep", "Confira o CEP.");
  const endereco = texto("endereco");
  if (endereco.length < 3) return falha("endereco", "Informe a rua.");
  const numero = texto("numero");
  if (!numero) return falha("numero", "Informe o número (ou S/N).");
  const bairro = texto("bairro");
  if (bairro.length < 2) return falha("bairro", "Informe o bairro.");

  return {
    dados: {
      nome,
      email,
      cpf,
      nascimento,
      celular,
      rendaMensal: renda / 100,
      cep,
      endereco,
      numero,
      complemento: texto("complemento") || null,
      bairro,
    },
  };
}

function mensagemDoAsaas(e: unknown): EstadoConta {
  if (e instanceof ErroAsaas && e.status === 400) return { erro: `O parceiro de pagamentos recusou: ${e.message}` };
  console.error("Asaas", e);
  return { erro: "Não conseguimos falar com o parceiro de pagamentos. Tente de novo em alguns minutos." };
}

async function comTentativas<T>(fn: () => Promise<T>, vezes = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= vezes) throw e;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

export async function abrirConta(pageId: string, _: EstadoConta, form: FormData): Promise<EstadoConta> {
  const { perfil, pagina } = await paginaDoUsuario(pageId);
  if (!pagina) return { erro: "Você não tem acesso a esta página." };
  if (await contaDaPagina(pageId)) return { erro: "Esta página já tem uma conta da família." };

  const lido = lerTitular(form, perfil.email);
  if ("erro" in lido) return lido;

  let sub;
  try {
    sub = await criarSubconta(lido.dados);
  } catch (e) {
    return mensagemDoAsaas(e);
  }

  // A chave só aparece agora; grava antes de qualquer outra chamada.
  const [conta] = await db
    .insert(payoutAccounts)
    .values({
      pageId,
      gatewaySubcontaId: sub.id,
      gatewayWalletId: sub.walletId,
      gatewayApiKeyCifrada: cifrar(sub.apiKey),
      titular: lido.dados.nome,
    })
    .returning();

  let aviso = "Conta aberta! Agora falta a verificação de identidade.";
  try {
    const cliente = await comTentativas(() => criarClienteConvidados(sub.apiKey, lido.dados));
    await db.update(payoutAccounts).set({ gatewayClienteId: cliente }).where(eq(payoutAccounts.id, conta.id));
  } catch (e) {
    console.error("Asaas: cliente Convidados", e);
    aviso = "Conta aberta, mas falta um passo: confirme o CPF abaixo.";
  }
  revalidatePath(`/painel/paginas/${pageId}`, "layout");
  return { aviso };
}

/** Termina a abertura quando o cliente "Convidados" não foi criado junto com a subconta. */
export async function confirmarCpf(pageId: string, _: EstadoConta, form: FormData): Promise<EstadoConta> {
  const { pagina } = await paginaDoUsuario(pageId);
  const conta = pagina && (await contaDaPagina(pageId));
  if (!conta) return { erro: "Você não tem acesso a esta página." };
  if (conta.gatewayClienteId) return { aviso: "Tudo certo." };

  const cpf = digitos(String(form.get("cpf") ?? ""));
  if (!cpfValido(cpf)) return { campo: "cpf", erro: "Confira o CPF." };
  try {
    const cliente = await criarClienteConvidados(chaveDaConta(conta), { nome: conta.titular, cpf });
    await db.update(payoutAccounts).set({ gatewayClienteId: cliente }).where(eq(payoutAccounts.id, conta.id));
  } catch (e) {
    return mensagemDoAsaas(e);
  }
  revalidatePath(`/painel/paginas/${pageId}`, "layout");
  return { aviso: "Tudo certo." };
}

/** Só no sandbox: aprova a subconta sem mandar documentos. */
export async function aprovarContaSandbox(pageId: string): Promise<void> {
  if (!sandbox()) return;
  const { pagina } = await paginaDoUsuario(pageId);
  const conta = pagina && (await contaDaPagina(pageId));
  if (!conta) return;
  await aprovarNoSandbox(chaveDaConta(conta));
  await sincronizarConta(conta);
  revalidatePath(`/painel/paginas/${pageId}`, "layout");
}

export async function publicarPagina(pageId: string): Promise<EstadoConta> {
  const { pagina } = await paginaDoUsuario(pageId);
  if (!pagina) return { erro: "Você não tem acesso a esta página." };
  const conta = await contaDaPagina(pageId);
  if (!conta || (await sincronizarConta(conta)) !== "aprovada" || !conta.gatewayClienteId) {
    return { erro: "A conta da família ainda não foi aprovada." };
  }
  if (pagina.status !== "rascunho") return {};
  await db.update(pages).set({ status: "no_ar" }).where(eq(pages.id, pageId));
  revalidatePath("/painel", "layout");
  revalidatePath(`/${pagina.slug}`);
  return { aviso: "Página no ar!" };
}
