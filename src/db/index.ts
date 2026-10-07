import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { urlBanco } from "@/lib/env";
import * as schema from "./schema";

// Conexão do servidor com o Postgres do Supabase pelo pooler (modo transaction);
// `prepare: false` é exigido por esse modo.
const conexao = postgres(urlBanco(), { prepare: false });

export const db = drizzle(conexao, { schema });
