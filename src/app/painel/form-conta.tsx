"use client";

import { startTransition, useActionState } from "react";
import { botao, campo, Mensagem, Rotulo } from "@/components/campos";
import type { EstadoConta } from "./acoes-conta";

type Acao = (estado: EstadoConta, form: FormData) => Promise<EstadoConta>;

// Envio manual (sem `action` no form) para o React não limpar os campos quando houver erro.
function useEnvio(acao: Acao) {
  const [estado, enviar, enviando] = useActionState(acao, {});
  function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    startTransition(() => enviar(dados));
  }
  const invalido = (nome: string) => (estado.campo === nome ? "border-[#c2410c]" : "");
  return { estado, enviando, aoEnviar, invalido };
}

/** Dados de quem recebe, pedidos pelo Asaas para abrir a subconta. */
export function FormConta({ acao, nomeInicial }: { acao: Acao; nomeInicial: string }) {
  const { estado, enviando, aoEnviar, invalido } = useEnvio(acao);
  const c = (nome: string) => `${campo} ${invalido(nome)}`;

  return (
    <form onSubmit={aoEnviar} className="grid gap-4 rounded-xl border border-line bg-surface p-5">
      <Rotulo texto="Nome completo de quem recebe">
        <input name="nome" required autoComplete="name" defaultValue={nomeInicial} className={c("nome")} />
      </Rotulo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Rotulo texto="CPF">
          <input name="cpf" required inputMode="numeric" placeholder="000.000.000-00" className={c("cpf")} />
        </Rotulo>
        <Rotulo texto="Data de nascimento">
          <input name="nascimento" type="date" required autoComplete="bday" className={c("nascimento")} />
        </Rotulo>
        <Rotulo texto="Celular">
          <input name="celular" required inputMode="tel" autoComplete="tel-national" placeholder="(11) 91234-5678" className={c("celular")} />
        </Rotulo>
        <Rotulo texto="Renda mensal aproximada (R$)">
          <input name="renda" required inputMode="decimal" placeholder="3.000,00" className={c("renda")} />
        </Rotulo>
        <Rotulo texto="CEP">
          <input name="cep" required inputMode="numeric" autoComplete="postal-code" className={c("cep")} />
        </Rotulo>
        <Rotulo texto="Bairro">
          <input name="bairro" required className={c("bairro")} />
        </Rotulo>
      </div>
      <Rotulo texto="Rua">
        <input name="endereco" required autoComplete="address-line1" className={c("endereco")} />
      </Rotulo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Rotulo texto="Número">
          <input name="numero" required className={c("numero")} />
        </Rotulo>
        <Rotulo texto="Complemento (opcional)">
          <input name="complemento" autoComplete="address-line2" className={c("complemento")} />
        </Rotulo>
      </div>
      <p className="text-sm text-muted">
        Esses dados vão direto para o parceiro de pagamentos (Asaas), que abre a conta em nome de quem recebe. O
        Fraldômetro não guarda o CPF.
      </p>
      <div className="grid justify-items-start gap-3">
        <Mensagem erro={estado.erro} aviso={estado.aviso} />
        <button disabled={enviando} className={botao}>
          {enviando ? "Abrindo a conta…" : "Abrir a conta da família"}
        </button>
      </div>
    </form>
  );
}

export function FormCpf({ acao }: { acao: Acao }) {
  const { estado, enviando, aoEnviar, invalido } = useEnvio(acao);
  return (
    <form onSubmit={aoEnviar} className="grid justify-items-start gap-3">
      <Rotulo texto="CPF de quem recebe">
        <input name="cpf" required inputMode="numeric" className={`${campo} ${invalido("cpf")}`} />
      </Rotulo>
      <Mensagem erro={estado.erro} aviso={estado.aviso} />
      <button disabled={enviando} className={botao}>
        Confirmar
      </button>
    </form>
  );
}

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
