"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { confirmarNoSandbox, criarCobrancaPix, sandbox } from "@/lib/asaas";
import { calcularDoacao } from "@/lib/dinheiro";
import { chaveDaConta, conciliarDoacao, contaDaPagina } from "@/lib/pagamentos";
import { paginaNoAr } from "@/lib/paginas";

export type EstadoDoacao = { erro?: string };

const NOME_MAX = 60;
const RECADO_MAX = 280;

/** O convidado escolheu as fraldas: cria a cobrança Pix na conta da família e abre a tela do QR Code. */
export async function criarDoacao(slug: string, _: EstadoDoacao, form: FormData): Promise<EstadoDoacao> {
  const texto = (nome: string) => String(form.get(nome) ?? "").trim();

  const pagina = await paginaNoAr(slug);
  if (!pagina) return { erro: "Esta página não está recebendo doações." };
  if (pagina.encerraEm && pagina.encerraEm < new Date()) return { erro: "As doações desta página já foram encerradas." };

  const conta = await contaDaPagina(pagina.id);
  if (!conta?.gatewayClienteId || conta.statusVerificacao !== "aprovada") {
    return { erro: "A conta da família ainda não está pronta para receber. Tente mais tarde." };
  }

  const fraldas = Number(texto("fraldas"));
  if (!Number.isInteger(fraldas) || fraldas < 1 || fraldas > 5000) return { erro: "Escolha quantas fraldas doar." };
  const nome = texto("nome");
  if (nome.length < 2 || nome.length > NOME_MAX) return { erro: "Diga seu nome, para a família saber quem doou." };
  const recado = texto("recado").slice(0, RECADO_MAX) || null;
  const email = texto("email") || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "Confira o e-mail." };
  const cobrirTaxa = form.get("cobrirTaxa") === "on";

  const { taxa, totalPago } = calcularDoacao(fraldas, pagina.valorFraldaCentavos, cobrirTaxa);
  const id = randomUUID();

  let cobrancaId: string;
  try {
    const cobranca = await criarCobrancaPix(chaveDaConta(conta), {
      cliente: conta.gatewayClienteId,
      valorCentavos: totalPago,
      comissaoCentavos: taxa,
      descricao: `${fraldas} fraldas para ${pagina.nomeBebe}, de ${nome}`,
      referencia: id,
    });
    cobrancaId = cobranca.id;
  } catch (e) {
    console.error("Asaas: cobrança", e);
    return { erro: "Não conseguimos gerar o Pix agora. Tente de novo em instantes." };
  }

  await db.insert(donations).values({
    id,
    pageId: pagina.id,
    nomeConvidado: nome,
    recado,
    emailConvidado: email,
    fraldas,
    valorCentavos: totalPago,
    comissaoCentavos: taxa,
    cobriuTaxa: cobrirTaxa,
    gatewayCobrancaId: cobrancaId,
  });
  redirect(`/${slug}/doacao/${id}`);
}

/** Só no sandbox: simula o Pix do convidado. */
export async function simularPagamento(doacaoId: string): Promise<void> {
  if (!sandbox()) return;
  const [doacao] = await db.select().from(donations).where(eq(donations.id, doacaoId)).limit(1);
  const conta = doacao && (await contaDaPagina(doacao.pageId));
  if (!conta || doacao.status !== "aguardando") return;
  await confirmarNoSandbox(chaveDaConta(conta), doacao.gatewayCobrancaId);
  await conciliarDoacao(doacao, conta);
}
