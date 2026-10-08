ALTER TABLE "payout_accounts" ADD COLUMN "gateway_wallet_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "gateway_api_key_cifrada" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "gateway_cliente_id" text;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "titular" text NOT NULL;