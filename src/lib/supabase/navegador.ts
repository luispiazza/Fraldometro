import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

// Cliente do Supabase no navegador: login e o fraldômetro ao vivo (Realtime).
export function criarClienteNavegador() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
