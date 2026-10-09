import type { Metadata } from "next";
import Link from "next/link";
import { botao, botaoSecundario } from "@/components/campos";
import { PERGUNTAS } from "@/lib/perguntas";

export const metadata: Metadata = { title: "Como funciona" };

export default function ComoFunciona() {
  return (
    <div className="mx-auto grid max-w-3xl gap-10 px-5 pt-8 pb-20">
      <header className="grid gap-4">
        <h1 className="titulo text-[clamp(36px,5vw,56px)] leading-[1.04] text-balance">Como funciona</h1>
        <p className="text-lg text-muted">
          Vocês criam a página do bebê, mandam o link e acompanham as fraldas doadas subirem no fraldômetro.
        </p>
      </header>

      <div className="grid gap-3">
        {PERGUNTAS.map(({ p, r }) => (
          <details key={p} className="cartao group p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold">
              {p}
              <span aria-hidden className="titulo text-2xl leading-none transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted">{r}</p>
          </details>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/entrar" className={botao}>
          Criar a página do bebê
        </Link>
        <Link href="/exemplo/recortes" className={botaoSecundario}>
          Ver um exemplo
        </Link>
      </div>
    </div>
  );
}
