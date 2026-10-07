// Regras da página do bebê usadas no servidor e no navegador.

import { supabaseUrl } from "@/lib/env";

export type Sexo = "menino" | "menina" | "surpresa";

/** Endereços que já são do site e não podem virar página de bebê. */
const RESERVADOS = new Set([
  "admin", "ajuda", "api", "auth", "b", "cadastro", "como-funciona", "conta", "contato", "entrar", "exemplo",
  "fraldometro", "login", "p", "painel", "privacidade", "sair", "sobre", "termos",
]);

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

/** "Antônio Souza" → "antonio-souza" */
export function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
}

/** Mensagem de erro, ou null se o endereço pode ser usado (falta só conferir se está livre). */
export function problemaNoSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `O link precisa ter pelo menos ${SLUG_MIN} letras.`;
  if (slug.length > SLUG_MAX || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return "Use só letras sem acento, números e hífen.";
  }
  if (RESERVADOS.has(slug)) return "Esse link é reservado. Tente outro.";
  return null;
}

/** "o Antonio", "a Maria", "Bebê" (surpresa fica sem artigo). */
export function artigo(sexo: Sexo): string {
  return sexo === "menino" ? "o" : sexo === "menina" ? "a" : "";
}

/** "do Antonio", "da Maria", "de Bebê". */
export function contracao(sexo: Sexo): string {
  return sexo === "menino" ? "do" : sexo === "menina" ? "da" : "de";
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-12" → "dezembro" (ou "dezembro de 2027", se não for o ano corrente). */
export function formatarMes(anoMes: string | null, hoje = new Date()): string | null {
  const m = anoMes?.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const nome = MESES[Number(m[2]) - 1];
  if (!nome) return null;
  return Number(m[1]) === hoje.getFullYear() ? nome : `${nome} de ${m[1]}`;
}

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });

/** 2026-12-20 → "20 de dezembro" */
export function formatarData(data: Date | null): string | null {
  return data ? dataCurta.format(data) : null;
}

/** Endereço público da foto no Supabase Storage (bucket "fotos"). */
export function urlDaFoto(caminho: string | null): string | null {
  return caminho ? `${supabaseUrl()}/storage/v1/object/public/fotos/${caminho}` : null;
}

/** "2,50" → 250. NaN se não for um valor válido. */
export function reaisParaCentavos(texto: string): number {
  const limpo = texto.replace(/[R$\s.]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return NaN;
  return Math.round(Number(limpo) * 100);
}
