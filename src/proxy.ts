import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";

// Renova a sessão do Supabase (os cookies) antes das páginas da área logada e
// redireciona para /entrar quem abre o painel sem sessão. A checagem que vale
// fica em src/lib/auth.ts; esta é só a rápida.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [chave, valor] of Object.entries(headers ?? {})) response.headers.set(chave, valor);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && request.nextUrl.pathname.startsWith("/painel")) {
    const redirecionamento = NextResponse.redirect(new URL("/entrar", request.url));
    for (const cookie of response.cookies.getAll()) redirecionamento.cookies.set(cookie);
    return redirecionamento;
  }

  return response;
}

// Só as rotas que leem a sessão; o site institucional segue estático.
export const config = {
  matcher: ["/painel/:path*", "/entrar/:path*", "/auth/:path*"],
};
