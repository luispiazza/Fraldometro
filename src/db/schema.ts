import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgPolicy,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authUid, authUsers, authenticatedRole } from "drizzle-orm/supabase";

// Valores em dinheiro sempre em centavos (integer). Nenhum CPF é guardado aqui:
// os dados de identificação ficam no gateway, que verifica a subconta.
//
// O app grava pelo servidor, com a conexão do banco (DATABASE_URL), que não passa pelas
// regras abaixo. As regras protegem o acesso pelo cliente do Supabase (navegador e Realtime).

const criadoEm = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// Quem é membro da página da linha atual (usado nas regras de acesso).
const ehMembro = (colunaPagina: string) =>
  sql`exists (select 1 from page_members m where m.page_id = ${sql.raw(colunaPagina)} and m.user_id = ${authUid})`;

export const sexo = pgEnum("sexo", ["menino", "menina", "surpresa"]);
export const statusPagina = pgEnum("status_pagina", ["rascunho", "no_ar", "encerrada", "suspensa"]);
export const papelMembro = pgEnum("papel_membro", ["dono", "coeditor"]);
export const statusVerificacao = pgEnum("status_verificacao", ["pendente", "em_analise", "aprovada", "recusada"]);
export const statusDoacao = pgEnum("status_doacao", ["aguardando", "paga", "expirada", "devolvida"]);

/** Quem administra páginas. O id é o mesmo do usuário no Supabase Auth. */
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    whatsapp: text("whatsapp"),
    aceitaAvisos: boolean("aceita_avisos").notNull().default(true),
    createdAt: criadoEm(),
  },
  (t) => [
    pgPolicy("usuario le o proprio perfil", { for: "select", to: authenticatedRole, using: sql`${t.id} = ${authUid}` }),
    pgPolicy("usuario edita o proprio perfil", {
      for: "update",
      to: authenticatedRole,
      using: sql`${t.id} = ${authUid}`,
      withCheck: sql`${t.id} = ${authUid}`,
    }),
  ],
);

/** A página do bebê. */
export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    nomeBebe: text("nome_bebe").notNull(),
    sexo: sexo("sexo").notNull().default("surpresa"),
    jaNasceu: boolean("ja_nasceu").notNull().default(false),
    mesPrevisto: text("mes_previsto"), // "2026-12"
    tema: text("tema").notNull().default("placar"), // id de src/themes
    fotoPath: text("foto_path"), // caminho no Supabase Storage
    recado: text("recado"),
    metaFraldas: integer("meta_fraldas").notNull(),
    valorFraldaCentavos: integer("valor_fralda_centavos").notNull(),
    status: statusPagina("status").notNull().default("rascunho"),
    encerraEm: timestamp("encerra_em", { withTimezone: true }),
    createdAt: criadoEm(),
  },
  (t) => [
    uniqueIndex("pages_slug_idx").on(t.slug),
    pgPolicy("pagina no ar e publica", { for: "select", to: [anonRole, authenticatedRole], using: sql`${t.status} = 'no_ar'` }),
    pgPolicy("membro le a pagina", { for: "select", to: authenticatedRole, using: ehMembro("pages.id") }),
    pgPolicy("membro edita a pagina", {
      for: "update",
      to: authenticatedRole,
      using: ehMembro("pages.id"),
      withCheck: ehMembro("pages.id"),
    }),
  ],
);

/** Quem pode editar cada página. */
export const pageMembers = pgTable(
  "page_members",
  {
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    papel: papelMembro("papel").notNull().default("dono"),
    createdAt: criadoEm(),
  },
  (t) => [
    primaryKey({ columns: [t.pageId, t.userId] }),
    index("page_members_user_idx").on(t.userId),
    pgPolicy("usuario ve as proprias participacoes", { for: "select", to: authenticatedRole, using: sql`${t.userId} = ${authUid}` }),
  ],
);

/** A subconta da família no gateway (Asaas). */
export const payoutAccounts = pgTable(
  "payout_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    gatewaySubcontaId: text("gateway_subconta_id").notNull(),
    gatewayWalletId: text("gateway_wallet_id").notNull(),
    // A chave de API da subconta, cifrada (src/lib/cifra.ts). O Asaas só a mostra na criação.
    gatewayApiKeyCifrada: text("gateway_api_key_cifrada").notNull(),
    // Cliente "Convidados" da subconta, usado em todas as cobranças (ver src/lib/asaas.ts).
    // Fica vazio se a criação falhou logo depois da subconta; o painel pede o CPF de novo.
    gatewayClienteId: text("gateway_cliente_id"),
    titular: text("titular").notNull(), // nome de quem recebe, como aparece no Pix
    statusVerificacao: statusVerificacao("status_verificacao").notNull().default("pendente"),
    createdAt: criadoEm(),
  },
  (t) => [
    uniqueIndex("payout_accounts_page_idx").on(t.pageId),
    pgPolicy("membro ve a subconta", { for: "select", to: authenticatedRole, using: ehMembro("payout_accounts.page_id") }),
  ],
);

/** Cada doação. Só vira "paga" com a confirmação do gateway (webhook validado ou consulta à API). */
export const donations = pgTable(
  "donations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "restrict" }),
    nomeConvidado: text("nome_convidado").notNull(),
    recado: text("recado"),
    emailConvidado: text("email_convidado"), // opcional, só para o comprovante
    fraldas: integer("fraldas").notNull(),
    valorCentavos: integer("valor_centavos").notNull(),
    comissaoCentavos: integer("comissao_centavos").notNull(),
    cobriuTaxa: boolean("cobriu_taxa").notNull(),
    status: statusDoacao("status").notNull().default("aguardando"),
    gatewayCobrancaId: text("gateway_cobranca_id").notNull(),
    pagoEm: timestamp("pago_em", { withTimezone: true }),
    createdAt: criadoEm(),
  },
  (t) => [
    uniqueIndex("donations_cobranca_idx").on(t.gatewayCobrancaId),
    index("donations_page_status_idx").on(t.pageId, t.status),
    pgPolicy("membro ve as doacoes", { for: "select", to: authenticatedRole, using: ehMembro("donations.page_id") }),
  ],
);

/** Tudo que o gateway enviou. O id do evento é único: um aviso repetido não conta duas vezes. */
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gatewayEventoId: text("gateway_evento_id").notNull(),
    tipo: text("tipo").notNull(),
    conteudo: jsonb("conteudo").notNull(),
    processadoEm: timestamp("processado_em", { withTimezone: true }),
    createdAt: criadoEm(),
  },
  // RLS ligada e sem regras: só o servidor lê e grava.
  (t) => [uniqueIndex("webhook_events_evento_idx").on(t.gatewayEventoId)],
).enableRLS();

/** Total de fraldas de cada página: soma das doações pagas, calculada pelo banco. */
export const pageTotals = pgView("page_totals").as((qb) =>
  qb
    .select({
      pageId: donations.pageId,
      totalFraldas: sql<number>`coalesce(sum(${donations.fraldas}), 0)::int`.as("total_fraldas"),
      doadores: sql<number>`count(*)::int`.as("doadores"),
    })
    .from(donations)
    .where(sql`${donations.status} = 'paga'`)
    .groupBy(donations.pageId),
);
