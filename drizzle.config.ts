import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrações usam a conexão direta (porta 5432), não o pooler.
  dbCredentials: { url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL! },
  // Só o schema public é nosso; auth e storage são do Supabase.
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } },
});
