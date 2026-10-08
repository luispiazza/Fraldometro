"use client";

import { useActionState } from "react";
import { Mensagem } from "@/components/campos";
import type { EstadoConta } from "./acoes-conta";

export function BotaoPublicar({ acao }: { acao: () => Promise<EstadoConta> }) {
  const [estado, publicar, publicando] = useActionState(acao, {});
  return (
    <form action={publicar} className="flex flex-wrap items-center gap-3">
      <button disabled={publicando} className="rounded-full bg-fg px-5 py-3 text-sm font-semibold text-bg disabled:opacity-50">
        {publicando ? "Publicando…" : "Publicar"}
      </button>
      <Mensagem erro={estado.erro} />
    </form>
  );
}
