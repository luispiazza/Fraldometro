ALTER TABLE "payout_accounts" DROP COLUMN "gateway_subconta_id";--> statement-breakpoint
ALTER TABLE "payout_accounts" DROP COLUMN "gateway_wallet_id";--> statement-breakpoint
ALTER TABLE "payout_accounts" DROP COLUMN "gateway_api_key_cifrada";--> statement-breakpoint
ALTER TABLE "payout_accounts" DROP COLUMN "gateway_cliente_id";--> statement-breakpoint
ALTER TABLE "payout_accounts" DROP COLUMN "status_verificacao";--> statement-breakpoint
DROP TYPE "public"."status_verificacao";