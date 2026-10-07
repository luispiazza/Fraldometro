// Variáveis de ambiente. Os nomes com prefixo DATABASE_ vêm da integração Supabase da Vercel
// (puxe-as para o .env.local com `vercel env pull`); os nomes curtos ficam como alternativa.
// As NEXT_PUBLIC_* precisam ser lidas pelo nome literal para o Next.js embuti-las no navegador.

export const supabaseUrl =
  process.env.NEXT_PUBLIC_DATABASE_SUPABASE_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_DATABASE_SUPABASE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * A integração acrescenta `supa=...` à URL do Postgres. O driver repassaria esse parâmetro
 * ao servidor, que o recusa ("unrecognized configuration parameter"), então ele sai aqui.
 */
export function limparUrlPostgres(url: string | undefined): string | undefined {
  if (!url) return url;
  const u = new URL(url);
  u.searchParams.delete("supa");
  return u.toString();
}

/** Pooler em modo transaction, usado pelo app. */
export function urlBanco(): string {
  return limparUrlPostgres(process.env.DATABASE_POSTGRES_URL ?? process.env.DATABASE_URL)!;
}

/** Conexão direta, usada só pelas migrações. */
export function urlBancoDireta(): string {
  return limparUrlPostgres(process.env.DATABASE_POSTGRES_URL_NON_POOLING ?? process.env.DIRECT_DATABASE_URL)!;
}
