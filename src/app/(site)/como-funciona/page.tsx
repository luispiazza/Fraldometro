import type { Metadata } from "next";
import Link from "next/link";
import { PERGUNTAS } from "@/lib/perguntas";

export const metadata: Metadata = { title: "Como funciona" };

export default function ComoFunciona() {
  return (
    <div className="mx-auto grid max-w-3xl gap-10 px-4 py-14">
      <header className="grid gap-4">
        <h1 className="text-[clamp(30px,5vw,46px)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">Como funciona</h1>
        <p className="text-lg text-muted">
          Vocês criam a página do bebê, mandam o link e acompanham as fraldas doadas subirem no fraldômetro.
        </p>
      </header>

      <dl className="grid gap-6">
        {PERGUNTAS.map(({ p, r }) => (
          <div key={p} className="grid gap-1.5 border-b border-line pb-6">
            <dt className="text-lg font-semibold">{p}</dt>
            <dd className="text-muted">{r}</dd>
          </div>
        ))}
      </dl>

      <Link href="/exemplo/placar" className="justify-self-start rounded-full bg-fg px-5 py-3 font-semibold text-bg">
        Ver uma página de exemplo
      </Link>
    </div>
  );
}
