// Variáveis de ambiente.
//
// Na Vercel, valem os nomes com prefixo DATABASE_ criados pela integração Supabase.
// Localmente, `vercel env pull` traz essas variáveis com o valor "[SENSITIVE]", então o
// Mac usa os nomes curtos, definidos em .env.development.local (que o pull não sobrescreve).
// As NEXT_PUBLIC_* precisam ser lidas pelo nome literal para o Next.js embuti-las no navegador.

const MASCARADO = "[SENSITIVE]";

function valor(v: string | undefined): string | undefined {
  return v && v !== MASCARADO ? v : undefined;
}

function exigir(v: string | undefined, nomeLocal: string): string {
  if (!v) {
    throw new Error(
      `Variável ausente. Na Vercel, confira a integração Supabase; localmente, defina ${nomeLocal} em .env.development.local.`,
    );
  }
  return v;
}

export function supabaseUrl(): string {
  return exigir(
    valor(process.env.NEXT_PUBLIC_DATABASE_SUPABASE_SUPABASE_URL) ?? valor(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "NEXT_PUBLIC_SUPABASE_URL",
  );
}

export function supabasePublishableKey(): string {
  return exigir(
    valor(process.env.NEXT_PUBLIC_DATABASE_SUPABASE_SUPABASE_PUBLISHABLE_KEY) ??
      valor(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
}

/**
 * A integração acrescenta `supa=...` à URL do Postgres. O driver repassaria esse parâmetro
 * ao servidor, que o recusa ("unrecognized configuration parameter"), então ele sai aqui.
 */
export function limparUrlPostgres(url: string): string {
  const u = new URL(url);
  u.searchParams.delete("supa");
  return u.toString();
}

const poolerTransaction = () => valor(process.env.DATABASE_POSTGRES_URL) ?? valor(process.env.DATABASE_URL);
const conexaoDireta = () =>
  valor(process.env.DATABASE_POSTGRES_URL_NON_POOLING) ?? valor(process.env.DIRECT_DATABASE_URL);

// Basta uma das duas URLs: se faltar uma, usa a outra.

/** Pooler em modo transaction, usado pelo app. */
export function urlBanco(): string {
  return limparUrlPostgres(exigir(poolerTransaction() ?? conexaoDireta(), "DATABASE_URL"));
}

/** Conexão para as migrações (direta ou session pooler, porta 5432). */
export function urlBancoDireta(): string {
  return limparUrlPostgres(exigir(conexaoDireta() ?? poolerTransaction(), "DATABASE_URL"));
}
