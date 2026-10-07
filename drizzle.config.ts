import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { urlBancoDireta } from "./src/lib/env";

// Mesma ordem do `next dev`: .env.development.local (valores locais) vence o .env.local (vercel env pull).
config({ path: [".env.development.local", ".env.local"], quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrações usam a conexão direta ou o session pooler, não o modo transaction.
  dbCredentials: { url: urlBancoDireta() },
  // Só o schema public é nosso; auth e storage são do Supabase.
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } },
});
