import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

// Link do e-mail de acesso, para quem clica em vez de digitar o código.
//
// - token_hash: vem do nosso template (supabase/templates/codigo.html). Funciona mesmo se o
//   link abrir em outro navegador, como o embutido do app de e-mail.
// - code: vem do template padrão do Supabase, usado enquanto não há SMTP próprio. Só funciona
//   no mesmo navegador em que o código foi pedido (fluxo PKCE).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await criarClienteServidor();
  let ok = false;
  if (tokenHash && tipo) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo })).error;
  else if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;

  // /entrar manda para o painel ou para completar o cadastro.
  return NextResponse.redirect(new URL(ok ? "/entrar" : "/entrar?erro=link", request.url));
}
