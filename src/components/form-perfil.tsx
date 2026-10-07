"use client";

import { useActionState } from "react";
import { salvarPerfil } from "@/app/(site)/entrar/acoes";
import { botao, campo, Mensagem, Rotulo } from "@/components/campos";

type Perfil = { nome: string; whatsapp: string | null; aceitaAvisos: boolean };

export function FormPerfil({ perfil, textoBotao }: { perfil?: Perfil; textoBotao: string }) {
  const [estado, acao, salvando] = useActionState(salvarPerfil, {});

  return (
    <form action={acao} className="grid gap-4">
      <Rotulo texto="Como podemos chamar você?">
        <input name="nome" autoComplete="name" required defaultValue={perfil?.nome} className={campo} />
      </Rotulo>
      <Rotulo texto="WhatsApp (opcional)">
        <input
          name="whatsapp"
          type="tel"
          autoComplete="tel"
          placeholder="(11) 98765-4321"
          defaultValue={perfil?.whatsapp ?? ""}
          className={campo}
        />
      </Rotulo>
      <label className="flex items-start gap-2.5 text-sm">
        <input
          name="aceitaAvisos"
          type="checkbox"
          defaultChecked={perfil?.aceitaAvisos ?? true}
          className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
        />
        Quero receber avisos de novas doações.
      </label>
      <Mensagem erro={estado.erro} aviso={estado.salvo ? "Dados salvos." : undefined} />
      <button disabled={salvando} className={botao}>
        {salvando ? "Salvando…" : textoBotao}
      </button>
    </form>
  );
}
