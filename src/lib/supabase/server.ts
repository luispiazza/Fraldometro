import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente do Supabase para Server Components, Server Actions e Route Handlers,
// com a sessão do usuário (login por link mágico) nos cookies.
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Chamado de um Server Component, onde cookies são só leitura.
          // A sessão é renovada pelo proxy quando o login entrar (fase 4).
        }
      },
    },
  });
}
