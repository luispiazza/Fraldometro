import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { conciliarDoacao, contaDaPagina } from "@/lib/pagamentos";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Status da doação, consultado pela tela do QR Code enquanto o convidado paga.
// Se ainda estiver aguardando, confere no Asaas (cobre o ambiente local e um webhook atrasado).
export async function GET(_: Request, { params }: RouteContext<"/api/doacoes/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ erro: "não encontrada" }, { status: 404 });

  let [doacao] = await db.select().from(donations).where(eq(donations.id, id)).limit(1);
  if (!doacao) return Response.json({ erro: "não encontrada" }, { status: 404 });

  if (doacao.status === "aguardando") {
    const conta = await contaDaPagina(doacao.pageId);
    if (conta) doacao = await conciliarDoacao(doacao, conta).catch(() => doacao);
  }
  return Response.json({ status: doacao.status }, { headers: { "Cache-Control": "no-store" } });
}
