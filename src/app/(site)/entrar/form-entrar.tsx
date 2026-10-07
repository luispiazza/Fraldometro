"use client";

import { useActionState } from "react";
import { botao, campo, Mensagem, Rotulo } from "@/components/campos";
import { confirmarCodigo, enviarCodigo, type EstadoEntrar } from "./acoes";

const INICIAL: EstadoEntrar = { etapa: "email", email: "" };

export function FormEntrar() {
  const [estadoEmail, pedirCodigo, enviando] = useActionState(enviarCodigo, INICIAL);
  const naEtapaCodigo = estadoEmail.etapa === "codigo";

  if (!naEtapaCodigo) {
    return (
      <form action={pedirCodigo} className="grid gap-4">
        <Rotulo texto="Seu e-mail">
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            autoFocus
            defaultValue={estadoEmail.email}
            className={campo}
          />
        </Rotulo>
        <Mensagem erro={estadoEmail.erro} />
        <button disabled={enviando} className={botao}>
          {enviando ? "Enviando…" : "Receber código"}
        </button>
      </form>
    );
  }

  return <FormCodigo inicial={estadoEmail} />;
}

function FormCodigo({ inicial }: { inicial: EstadoEntrar }) {
  const [estado, acao, confirmando] = useActionState(confirmarCodigo, inicial);

  return (
    <form action={acao} className="grid gap-4">
      <input type="hidden" name="email" value={estado.email} />
      <p>
        Mandamos um e-mail para <strong>{estado.email}</strong>. Digite o código ou clique no link que está nele. Pode levar um minutinho; confira também o spam.
      </p>
      <Rotulo texto="Código">
        <input
          name="codigo"
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9 ]*"
          maxLength={9}
          autoFocus
          className={`${campo} text-center font-mono text-2xl tracking-[0.3em]`}
        />
      </Rotulo>
      <Mensagem erro={estado.erro} aviso={estado.aviso} />
      <button disabled={confirmando} className={botao}>
        {confirmando ? "Conferindo…" : "Entrar"}
      </button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <button name="acao" value="reenviar" formNoValidate disabled={confirmando} className="font-semibold hover:text-brand">
          Mandar outro código
        </button>
        {/* Recarga completa de propósito: zera o formulário e volta para a etapa do e-mail. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/entrar" className="text-muted hover:text-fg">
          Usar outro e-mail
        </a>
      </div>
    </form>
  );
}
