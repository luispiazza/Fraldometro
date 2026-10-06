import { createBrowserClient } from "@supabase/ssr";

// Cliente do Supabase no navegador: login e o fraldômetro ao vivo (Realtime).
export function criarClienteNavegador() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
