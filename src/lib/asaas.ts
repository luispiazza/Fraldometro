import "server-only";

// Cliente da API v3 do Asaas (https://docs.asaas.com).
//
// - A conta raiz (ASAAS_API_KEY) é a do Fraldômetro: cria as subcontas e recebe a comissão.
// - Cada família tem uma subconta; as cobranças são criadas com a chave dela, então o Pix
//   sai em nome do titular e o dinheiro cai na conta da família. A comissão vai por split.

export type AsaasErro = { code?: string; description: string };

export class ErroAsaas extends Error {
  constructor(
    readonly status: number,
    readonly erros: AsaasErro[],
  ) {
    super(erros.map((e) => e.description).join(" ") || `Asaas respondeu ${status}.`);
  }
}

export function sandbox(): boolean {
  return process.env.ASAAS_AMBIENTE !== "producao";
}

function baseUrl(): string {
  return sandbox() ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
}

function chaveRaiz(): string {
  const k = process.env.ASAAS_API_KEY;
  if (!k) throw new Error("Defina ASAAS_API_KEY (chave da conta do Fraldômetro no Asaas).");
  return k;
}

async function chamar<T>(chave: string, metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${caminho}`, {
    method: metodo,
    headers: {
      access_token: chave,
      "User-Agent": "Fraldometro",
      ...(corpo === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErroAsaas(res.status, json?.errors ?? []);
  return json as T;
}

// ---------- Conta do Fraldômetro ----------

let walletRaiz: Promise<string> | null = null;

/** A carteira da conta do Fraldômetro, que recebe a comissão no split. */
export function carteiraDoFraldometro(): Promise<string> {
  walletRaiz ??= chamar<{ data: { id: string }[] }>(chaveRaiz(), "GET", "/wallets").then((r) => {
    const id = r.data[0]?.id;
    if (!id) throw new Error("A conta do Asaas não tem carteira.");
    return id;
  });
  walletRaiz.catch(() => (walletRaiz = null));
  return walletRaiz;
}

// ---------- Subconta da família ----------

export type DadosTitular = {
  nome: string;
  email: string;
  cpf: string;
  nascimento: string; // "1990-05-31"
  celular: string;
  rendaMensal: number; // em reais
  cep: string;
  endereco: string;
  numero: string;
  complemento: string | null;
  bairro: string;
};

const EVENTOS = [
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_RESTORED",
  "PAYMENT_REFUNDED",
  "ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED",
  "ACCOUNT_STATUS_GENERAL_APPROVAL_AWAITING_APPROVAL",
  "ACCOUNT_STATUS_GENERAL_APPROVAL_PENDING",
  "ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED",
];

/** Endereço público do webhook, ou null quando o site roda só no Mac (o Asaas não alcança). */
function urlWebhook(): string | null {
  const site = process.env.SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  return site?.startsWith("https://") ? `${site.replace(/\/$/, "")}/api/asaas/webhook` : null;
}

type RespostaConta = { id: string; walletId: string; apiKey?: string; accessToken?: { apiKey?: string } };

/** Cria a subconta. A chave de API volta só agora: guarde-a cifrada. */
export async function criarSubconta(t: DadosTitular) {
  const webhook = urlWebhook();
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  const conta = await chamar<RespostaConta>(chaveRaiz(), "POST", "/accounts", {
    name: t.nome,
    email: t.email,
    cpfCnpj: t.cpf,
    birthDate: t.nascimento,
    mobilePhone: t.celular,
    incomeValue: t.rendaMensal,
    postalCode: t.cep,
    address: t.endereco,
    addressNumber: t.numero,
    complement: t.complemento ?? undefined,
    province: t.bairro,
    webhooks:
      webhook && token
        ? [
            {
              name: "Fraldômetro",
              url: webhook,
              email: process.env.ASAAS_WEBHOOK_EMAIL ?? t.email,
              enabled: true,
              interrupted: false,
              apiVersion: 3,
              authToken: token,
              sendType: "SEQUENTIALLY",
              events: EVENTOS,
            },
          ]
        : undefined,
  });
  const apiKey = conta.accessToken?.apiKey ?? conta.apiKey;
  if (!apiKey) throw new Error("O Asaas criou a subconta mas não devolveu a chave de API.");
  return { id: conta.id, walletId: conta.walletId, apiKey };
}

export type SituacaoAsaas = "PENDING" | "APPROVED" | "REJECTED" | "AWAITING_APPROVAL";

export function situacaoDaConta(chave: string) {
  return chamar<{ general: SituacaoAsaas }>(chave, "GET", "/myAccount/status");
}

export type DocumentoPendente = {
  id: string;
  status: "NOT_SENT" | "PENDING" | "APPROVED" | "REJECTED" | "IGNORED";
  title: string;
  description: string;
  onboardingUrl: string | null;
};

export async function documentosPendentes(chave: string): Promise<DocumentoPendente[]> {
  const r = await chamar<{ data: DocumentoPendente[] }>(chave, "GET", "/myAccount/documents");
  return r.data;
}

/** Só no sandbox: aprova a subconta sem documentos. */
export function aprovarNoSandbox(chave: string) {
  return chamar(chave, "POST", "/sandbox/myAccount/approve");
}

/** Chave Pix aleatória da subconta; sem ela o QR Code vence no mesmo dia. */
export async function garantirChavePix(chave: string) {
  const r = await chamar<{ data: { status: string }[] }>(chave, "GET", "/pix/addressKeys?status=ACTIVE");
  if (r.data.length === 0) await chamar(chave, "POST", "/pix/addressKeys", { type: "EVP" });
}

/**
 * O Asaas exige CPF do pagador em cada cobrança. Para não pedir CPF aos convidados,
 * cada subconta tem um cliente só, "Convidados", com os dados do titular.
 */
export async function criarClienteConvidados(chave: string, t: { nome: string; cpf: string }): Promise<string> {
  const c = await chamar<{ id: string }>(chave, "POST", "/customers", {
    name: `Convidados de ${t.nome}`,
    cpfCnpj: t.cpf,
    notificationDisabled: true,
  });
  return c.id;
}

// ---------- Cobranças ----------

export type StatusCobranca =
  | "PENDING"
  | "CONFIRMED"
  | "RECEIVED"
  | "OVERDUE"
  | "REFUNDED"
  | "REFUND_REQUESTED"
  | "REFUND_IN_PROGRESS"
  | "RECEIVED_IN_CASH"
  | "DELETED"
  | string;

export type Cobranca = { id: string; status: StatusCobranca; value: number; externalReference: string | null; deleted?: boolean };

const reais = (centavos: number) => Math.round(centavos) / 100;

export async function criarCobrancaPix(
  chave: string,
  c: { cliente: string; valorCentavos: number; comissaoCentavos: number; descricao: string; referencia: string },
): Promise<Cobranca> {
  // Vence amanhã (horário de Brasília); a família paga a taxa do Asaas e a comissão vai inteira.
  const amanha = new Date(Date.now() - 3 * 3600_000 + 24 * 3600_000).toISOString().slice(0, 10);
  return chamar<Cobranca>(chave, "POST", "/payments", {
    customer: c.cliente,
    billingType: "PIX",
    value: reais(c.valorCentavos),
    dueDate: amanha,
    description: c.descricao.slice(0, 500),
    externalReference: c.referencia,
    split: c.comissaoCentavos > 0 ? [{ walletId: await carteiraDoFraldometro(), fixedValue: reais(c.comissaoCentavos) }] : undefined,
  });
}

export function consultarCobranca(chave: string, id: string) {
  return chamar<Cobranca>(chave, "GET", `/payments/${encodeURIComponent(id)}`);
}

export function qrCodePix(chave: string, id: string) {
  return chamar<{ encodedImage: string; payload: string; expirationDate: string }>(
    chave,
    "GET",
    `/payments/${encodeURIComponent(id)}/pixQrCode`,
  );
}

/** Só no sandbox: simula o pagamento da cobrança. */
export function confirmarNoSandbox(chave: string, id: string) {
  return chamar<Cobranca>(chave, "POST", `/sandbox/payment/${encodeURIComponent(id)}/confirm`);
}
