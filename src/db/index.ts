import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Conexão do servidor com o Postgres do Supabase. Use a URL do pooler (modo transaction)
// em produção na Vercel; `prepare: false` é exigido por esse modo.
const conexao = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(conexao, { schema });
