"use client";

import { startTransition, useActionState, useState } from "react";
import { calcularDoacao, diasDeFralda, formatarNumero, formatarReais } from "@/lib/dinheiro";

const RAPIDOS = [20, 50, 100, 200];

export type AcaoDoar = (estado: { erro?: string }, form: FormData) => Promise<{ erro?: string }>;

const campoTema =
  "w-full rounded-lg border-[1.5px] border-[var(--t-track)] bg-transparent px-3 py-2.5 text-base outline-none focus:border-[var(--t-fg)]";

// Escolha de quantas fraldas doar e, em seguida, quem doa. Sem `acao` (prévia e exemplos),
// o botão só mostra o valor.
export function Doar({ valorFraldaCentavos, acao }: { valorFraldaCentavos: number; acao?: AcaoDoar }) {
  const [fraldas, setFraldas] = useState(50);
  const [cobrirTaxa, setCobrirTaxa] = useState(true);
  const [identificar, setIdentificar] = useState(false);
  const [estado, enviar, enviando] = useActionState<{ erro?: string }, FormData>(
    acao ?? (async () => ({ erro: "Na prévia o Pix não é gerado." })),
    {},
  );
  const { taxa, totalPago } = calcularDoacao(fraldas, valorFraldaCentavos, cobrirTaxa);
  const dias = diasDeFralda(fraldas);

  return (
    <div className="tema-card grid gap-3.5 p-[22px]">
      <h2 className="tema-display text-[22px] leading-tight">Quantas fraldas você quer doar?</h2>
      <div className="flex flex-wrap items-baseline justify-between gap-2.5">
        <b className="tema-display text-[30px] leading-none tabular-nums">{formatarNumero(fraldas)} fraldas</b>
        <span className="text-sm text-[var(--t-muted)]">
          cerca de {formatarNumero(dias)} {dias === 1 ? "dia" : "dias"} de fralda
        </span>
      </div>
      <input
        type="range"
        min={10}
        max={500}
        step={10}
        value={fraldas}
        onChange={(e) => setFraldas(Number(e.target.value))}
        aria-label="Quantidade de fraldas"
        className="w-full accent-[var(--t-accent)]"
      />
      <div className="flex flex-wrap gap-2">
        {RAPIDOS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setFraldas(q)}
            className="cursor-pointer rounded-full border-[1.5px] border-[var(--t-track)] px-3 py-1 text-sm font-semibold"
          >
            {q}
          </button>
        ))}
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-[14.5px]">
        <input
          type="checkbox"
          checked={cobrirTaxa}
          onChange={(e) => setCobrirTaxa(e.target.checked)}
          className="mt-1 h-[18px] w-[18px] flex-none accent-[var(--t-accent)]"
        />
        <span>
          Quero cobrir a taxa do Fraldômetro
          <small className="block text-[13px] text-[var(--t-muted)]">
            {cobrirTaxa
              ? `+ ${formatarReais(taxa)}, para a taxa não sair das fraldas.`
              : `Sem marcar, os ${formatarReais(taxa)} saem do valor doado.`}
          </small>
        </span>
      </label>
      {!identificar ? (
        <button
          type="button"
          onClick={() => setIdentificar(true)}
          className="tema-cta tema-display justify-self-start cursor-pointer px-[22px] py-[15px] text-lg leading-none"
        >
          Doar {formatarReais(totalPago)} via Pix
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const dados = new FormData(e.currentTarget);
            dados.set("fraldas", String(fraldas));
            if (cobrirTaxa) dados.set("cobrirTaxa", "on");
            startTransition(() => enviar(dados));
          }}
          className="grid gap-3"
        >
          <label className="grid gap-1 text-sm font-semibold">
            Seu nome
            <input name="nome" required minLength={2} maxLength={60} autoComplete="name" className={campoTema} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Recado para a família (opcional)
            <textarea name="recado" rows={2} maxLength={280} className={campoTema} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            E-mail para o comprovante (opcional)
            <input name="email" type="email" autoComplete="email" className={campoTema} />
          </label>
          {estado.erro && (
            <p role="alert" className="text-sm font-semibold text-[#c2410c]">
              {estado.erro}
            </p>
          )}
          <button
            disabled={enviando || !acao}
            className="tema-cta tema-display justify-self-start cursor-pointer px-[22px] py-[15px] text-lg leading-none disabled:cursor-default disabled:opacity-60"
          >
            {enviando ? "Gerando o Pix…" : `Gerar Pix de ${formatarReais(totalPago)}`}
          </button>
          {!acao && <p className="text-[13.5px] text-[var(--t-muted)]">Prévia: o Pix funciona quando a página estiver no ar.</p>}
        </form>
      )}
      <p className="text-[13.5px] text-[var(--t-muted)]">
        Cada fralda vale {formatarReais(valorFraldaCentavos)}, valor definido pelos pais. O Pix cai direto na conta da
        família.
      </p>
    </div>
  );
}
