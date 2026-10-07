import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { urlBancoDireta } from "./src/lib/env";

// Mesmo arquivo que `vercel env pull` e `next dev` usam.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrações usam a conexão direta, não o pooler.
  dbCredentials: { url: urlBancoDireta() },
  // Só o schema public é nosso; auth e storage são do Supabase.
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } },
});
