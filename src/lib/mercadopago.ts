import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Cliente da API do Mercado Pago, no modelo marketplace (https://www.mercadopago.com.br/developers).
//
// - A aplicação do Fraldômetro (MP_CLIENT_ID / MP_CLIENT_SECRET) é o "marketplace".
// - Cada família conecta a própria conta Mercado Pago por OAuth; guardamos o token dela.
// - O Pix é criado com o token da família, então o dinheiro cai direto na conta dela.
//   A comissão vai para a conta dona da aplicação pelo `application_fee`, e a taxa do
//   Mercado Pago sai da parte da família.

const API = "https://api.mercadopago.com";

export type ErroMP = { message?: string; error?: string; cause?: { code?: number | string; description?: string }[] };

export class ErroMercadoPago extends Error {
  constructor(
    readonly status: number,
    readonly corpo: ErroMP,
  ) {
    super(corpo.cause?.[0]?.description || corpo.message || corpo.error || `Mercado Pago respondeu ${status}.`);
  }

  /** Códigos de causa que o Mercado Pago devolveu (ex.: 13253, conta sem chave Pix). */
  get causas(): string[] {
    return (this.corpo.cause ?? []).map((c) => String(c.code));
  }
}

/** Em teste, o OAuth gera tokens de teste e a tela do Pix ganha o botão "Simular pagamento". */
export function emTeste(): boolean {
  return process.env.MP_AMBIENTE !== "producao";
}

function exigir(nome: "MP_CLIENT_ID" | "MP_CLIENT_SECRET"): string {
  const v = process.env[nome];
  if (!v) throw new Error(`Defina ${nome} (credenciais da aplicação do Fraldômetro no Mercado Pago).`);
  return v;
}

async function chamar<T>(
  metodo: string,
  caminho: string,
  { token, corpo, idempotencia }: { token?: string; corpo?: unknown; idempotencia?: string } = {},
): Promise<T> {
  const res = await fetch(`${API}${caminho}`, {
    method: metodo,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(idempotencia ? { "X-Idempotency-Key": idempotencia } : {}),
      ...(corpo === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErroMercadoPago(res.status, json ?? {});
  return json as T;
}

/** Endereço público do site, ou null quando roda só no Mac (o Mercado Pago não alcança). */
export function urlDoSite(): string | null {
  const site =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return site?.startsWith("https://") ? site.replace(/\/$/, "") : null;
}

// ---------- OAuth: a família conecta a conta dela ----------

/** Cookie com o `state` do OAuth e a página, conferido na volta. */
export const COOKIE_OAUTH = "mp_oauth";

/** Precisa ser idêntico ao cadastrado na aplicação, em "URLs de redirecionamento". */
export function urlDeRetorno(): string {
  const site = urlDoSite();
  if (!site) throw new Error("Defina SITE_URL com https: o Mercado Pago só volta para um endereço público.");
  return `${site}/painel/mercadopago/retorno`;
}

export function urlDeAutorizacao(estado: string): string {
  const u = new URL("https://auth.mercadopago.com.br/authorization");
  u.searchParams.set("client_id", exigir("MP_CLIENT_ID"));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("platform_id", "mp");
  u.searchParams.set("state", estado);
  u.searchParams.set("redirect_uri", urlDeRetorno());
  return u.toString();
}

export type Tokens = { accessToken: string; refreshToken: string; userId: string; expiraEm: Date };

type RespostaToken = { access_token: string; refresh_token: string; user_id: number; expires_in: number };

function lerTokens(r: RespostaToken): Tokens {
  return {
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    userId: String(r.user_id),
    expiraEm: new Date(Date.now() + r.expires_in * 1000),
  };
}

export async function trocarCodigo(codigo: string): Promise<Tokens> {
  const r = await chamar<RespostaToken>("POST", "/oauth/token", {
    corpo: {
      client_id: exigir("MP_CLIENT_ID"),
      client_secret: exigir("MP_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code: codigo,
      redirect_uri: urlDeRetorno(),
      ...(emTeste() ? { test_token: true } : {}),
    },
  });
  return lerTokens(r);
}

export async function renovarTokens(refreshToken: string): Promise<Tokens> {
  const r = await chamar<RespostaToken>("POST", "/oauth/token", {
    corpo: {
      client_id: exigir("MP_CLIENT_ID"),
      client_secret: exigir("MP_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    },
  });
  return lerTokens(r);
}

/** Nome do titular da conta conectada, como aparece para quem paga o Pix. */
export async function titularDaConta(token: string): Promise<string> {
  const eu = await chamar<{ first_name?: string; last_name?: string; nickname?: string }>("GET", "/users/me", { token });
  return [eu.first_name, eu.last_name].filter(Boolean).join(" ").trim() || eu.nickname || "Família";
}

// ---------- Pagamentos ----------

export type StatusPagamento =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"
  | string;

export type Pagamento = {
  id: number;
  status: StatusPagamento;
  live_mode: boolean;
  external_reference: string | null;
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
};

const reais = (centavos: number) => Math.round(centavos) / 100;

// O Mercado Pago exige o e-mail de quem paga. Quando o convidado não informa o dele,
// vai um endereço do nosso domínio, único por doação.
const emailDoPagador = (referencia: string, email: string | null) => email ?? `pix+${referencia.slice(0, 8)}@fraldometro.com.br`;

export async function criarPix(
  token: string,
  p: { valorCentavos: number; comissaoCentavos: number; descricao: string; referencia: string; nome: string; email: string | null },
): Promise<Pagamento> {
  const site = urlDoSite();
  // O Pix vale 24h; o Mercado Pago aceita de 30 minutos a 30 dias.
  const vence = new Date(Date.now() + 24 * 3600_000).toISOString().replace("Z", "+00:00");
  return chamar<Pagamento>("POST", "/v1/payments", {
    token,
    idempotencia: p.referencia,
    corpo: {
      transaction_amount: reais(p.valorCentavos),
      application_fee: p.comissaoCentavos > 0 ? reais(p.comissaoCentavos) : undefined,
      description: p.descricao.slice(0, 250),
      payment_method_id: "pix",
      external_reference: p.referencia,
      date_of_expiration: vence,
      payer: { email: emailDoPagador(p.referencia, p.email), first_name: p.nome.slice(0, 60) },
      notification_url: site ? `${site}/api/mercadopago/webhook?source_news=webhooks` : undefined,
    },
  });
}

export function consultarPagamento(token: string, id: string) {
  return chamar<Pagamento>("GET", `/v1/payments/${encodeURIComponent(id)}`, { token });
}

// ---------- Webhook ----------

/**
 * Confere a assinatura do aviso (cabeçalho x-signature, "ts=...,v1=..."), feita com a
 * assinatura secreta da aplicação (MP_WEBHOOK_SECRET) sobre "id:<data.id>;request-id:<x-request-id>;ts:<ts>;".
 */
export function assinaturaValida(assinatura: string | null, requestId: string | null, dataId: string): boolean {
  const segredo = process.env.MP_WEBHOOK_SECRET;
  if (!segredo || !assinatura) return false;
  const partes = Object.fromEntries(assinatura.split(",").map((p) => p.trim().split("=", 2) as [string, string]));
  if (!partes.ts || !partes.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifesto = `id:${id};${requestId ? `request-id:${requestId};` : ""}ts:${partes.ts};`;
  const esperado = Buffer.from(createHmac("sha256", segredo).update(manifesto).digest("hex"));
  const recebido = Buffer.from(partes.v1);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}
