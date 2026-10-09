"use client";

import { useActionState } from "react";
import { Mensagem } from "@/components/campos";
import type { EstadoConta } from "./acoes-conta";

export function BotaoPublicar({ acao }: { acao: () => Promise<EstadoConta> }) {
  const [estado, publicar, publicando] = useActionState(acao, {});
  return (
    <form action={publicar} className="flex flex-wrap items-center gap-3">
      <button disabled={publicando} className="titulo inline-flex items-center justify-center rounded-2xl border-[2.5px] border-fg bg-brand px-5 py-3 text-base leading-none text-fg shadow-[4px_4px_0_var(--fg)] disabled:opacity-50">
        {publicando ? "Publicando…" : "Publicar"}
      </button>
      <Mensagem erro={estado.erro} />
    </form>
  );
}
