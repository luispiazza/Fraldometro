CREATE TYPE "public"."papel_membro" AS ENUM('dono', 'coeditor');--> statement-breakpoint
CREATE TYPE "public"."sexo" AS ENUM('menino', 'menina', 'surpresa');--> statement-breakpoint
CREATE TYPE "public"."status_doacao" AS ENUM('aguardando', 'paga', 'expirada', 'devolvida');--> statement-breakpoint
CREATE TYPE "public"."status_pagina" AS ENUM('rascunho', 'no_ar', 'encerrada', 'suspensa');--> statement-breakpoint
CREATE TYPE "public"."status_verificacao" AS ENUM('pendente', 'em_analise', 'aprovada', 'recusada');--> statement-breakpoint
CREATE TABLE "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"nome_convidado" text NOT NULL,
	"recado" text,
	"email_convidado" text,
	"fraldas" integer NOT NULL,
	"valor_centavos" integer NOT NULL,
	"comissao_centavos" integer NOT NULL,
	"cobriu_taxa" boolean NOT NULL,
	"status" "status_doacao" DEFAULT 'aguardando' NOT NULL,
	"gateway_cobranca_id" text NOT NULL,
	"pago_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "donations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "page_members" (
	"page_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"papel" "papel_membro" DEFAULT 'dono' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_members_page_id_user_id_pk" PRIMARY KEY("page_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "page_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nome_bebe" text NOT NULL,
	"sexo" "sexo" DEFAULT 'surpresa' NOT NULL,
	"ja_nasceu" boolean DEFAULT false NOT NULL,
	"mes_previsto" text,
	"tema" text DEFAULT 'placar' NOT NULL,
	"foto_path" text,
	"recado" text,
	"meta_fraldas" integer NOT NULL,
	"valor_fralda_centavos" integer NOT NULL,
	"status" "status_pagina" DEFAULT 'rascunho' NOT NULL,
	"encerra_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payout_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"gateway_subconta_id" text NOT NULL,
	"status_verificacao" "status_verificacao" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payout_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text,
	"aceita_avisos" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gateway_evento_id" text NOT NULL,
	"tipo" text NOT NULL,
	"conteudo" jsonb NOT NULL,
	"processado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_members" ADD CONSTRAINT "page_members_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_members" ADD CONSTRAINT "page_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "donations_cobranca_idx" ON "donations" USING btree ("gateway_cobranca_id");--> statement-breakpoint
CREATE INDEX "donations_page_status_idx" ON "donations" USING btree ("page_id","status");--> statement-breakpoint
CREATE INDEX "page_members_user_idx" ON "page_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_accounts_page_idx" ON "payout_accounts" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_evento_idx" ON "webhook_events" USING btree ("gateway_evento_id");--> statement-breakpoint
CREATE VIEW "public"."page_totals" AS (select "page_id", coalesce(sum("fraldas"), 0)::int as "total_fraldas", count(*)::int as "doadores" from "donations" where "donations"."status" = 'paga' group by "donations"."page_id");--> statement-breakpoint
CREATE POLICY "membro ve as doacoes" ON "donations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from page_members m where m.page_id = donations.page_id and m.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "usuario ve as proprias participacoes" ON "page_members" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("page_members"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "pagina no ar e publica" ON "pages" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("pages"."status" = 'no_ar');--> statement-breakpoint
CREATE POLICY "membro le a pagina" ON "pages" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from page_members m where m.page_id = pages.id and m.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "membro edita a pagina" ON "pages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from page_members m where m.page_id = pages.id and m.user_id = (select auth.uid()))) WITH CHECK (exists (select 1 from page_members m where m.page_id = pages.id and m.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "membro ve a subconta" ON "payout_accounts" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from page_members m where m.page_id = payout_accounts.page_id and m.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "usuario le o proprio perfil" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ("users"."id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "usuario edita o proprio perfil" ON "users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ("users"."id" = (select auth.uid())) WITH CHECK ("users"."id" = (select auth.uid()));