import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { payoutAccounts } from "@/db/schema";
import { exigirPerfil } from "@/lib/auth";
import { cifrar } from "@/lib/cifra";
import { COOKIE_OAUTH, titularDaConta, trocarCodigo } from "@/lib/mercadopago";
import { paginaDoMembro } from "@/lib/paginas";

// Volta do Mercado Pago depois que a família autoriza o Fraldômetro (OAuth).
// O endereço precisa estar cadastrado na aplicação, em "URLs de redirecionamento".
export async function GET(request: NextRequest) {
  const perfil = await exigirPerfil();
  const params = request.nextUrl.searchParams;

  const jar = await cookies();
  const [estado, pageId] = (jar.get(COOKIE_OAUTH)?.value ?? "").split(".");
  jar.delete({ name: COOKIE_OAUTH, path: "/painel/mercadopago" });

  if (!estado || !pageId || params.get("state") !== estado) redirect("/painel");
  const pagina = await paginaDoMembro(pageId, perfil.id);
  if (!pagina) redirect("/painel");

  const voltar = `/painel/paginas/${pageId}/conta`;
  const codigo = params.get("code");
  if (!codigo) redirect(`${voltar}?erro=negado`);

  try {
    const tokens = await trocarCodigo(codigo);
    const titular = await titularDaConta(tokens.accessToken);
    const valores = {
      mpUserId: tokens.userId,
      mpAccessTokenCifrado: cifrar(tokens.accessToken),
      mpRefreshTokenCifrado: cifrar(tokens.refreshToken),
      mpTokenExpiraEm: tokens.expiraEm,
      titular,
    };
    await db
      .insert(payoutAccounts)
      .values({ pageId, ...valores })
      .onConflictDoUpdate({ target: payoutAccounts.pageId, set: valores });
  } catch (e) {
    console.error("Mercado Pago: OAuth", e);
    redirect(`${voltar}?erro=falhou`);
  }
  redirect(`${voltar}?conectada=1`);
}
