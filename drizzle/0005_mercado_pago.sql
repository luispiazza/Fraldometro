ALTER TABLE "payout_accounts" ADD COLUMN "mp_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "mp_access_token_cifrado" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "mp_refresh_token_cifrado" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payout_accounts" ADD COLUMN "mp_token_expira_em" timestamp with time zone NOT NULL;