import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { pageMembers, pages } from "@/db/schema";
import { exigirPerfil } from "@/lib/auth";

export const metadata: Metadata = { title: "Minhas páginas" };

const STATUS: Record<(typeof pages.$inferSelect)["status"], string> = {
  rascunho: "Rascunho",
  no_ar: "No ar",
  encerrada: "Encerrada",
  suspensa: "Suspensa",
};

export default async function Painel() {
  const perfil = await exigirPerfil();
  const minhas = await db
    .select({ id: pages.id, slug: pages.slug, nomeBebe: pages.nomeBebe, status: pages.status })
    .from(pageMembers)
    .innerJoin(pages, eq(pages.id, pageMembers.pageId))
    .where(eq(pageMembers.userId, perfil.id))
    .orderBy(pages.createdAt);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12">
      <h1 className="text-3xl font-bold tracking-[-0.02em]">Oi, {perfil.nome.split(" ")[0]}</h1>

      {minhas.length === 0 ? (
        <section className="grid max-w-xl justify-items-start gap-3 rounded-xl border border-line bg-surface p-6">
          <h2 className="text-xl font-semibold">Vamos criar a página do bebê?</h2>
          <p className="text-muted">
            Nome, foto, recado e a meta de fraldas. Depois é só mandar o link no grupo da família.
          </p>
          <Link href="/painel/nova" className="rounded-full bg-fg px-5 py-3 font-semibold text-bg">
            Criar a página
          </Link>
        </section>
      ) : (
        <div className="grid justify-items-start gap-4">
          <ul className="grid w-full gap-3 sm:grid-cols-2">
            {minhas.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/painel/paginas/${p.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-surface p-5 hover:border-fg"
                >
                  <span className="text-lg font-semibold">{p.nomeBebe}</span>
                  <span className="text-sm text-muted">
                    {STATUS[p.status]} · /{p.slug}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/painel/nova" className="text-sm font-semibold hover:text-brand">
            + Criar outra página
          </Link>
        </div>
      )}
    </div>
  );
}
