"use client";

import { useState } from "react";
import { calcularDoacao, diasDeFralda, formatarNumero, formatarReais } from "@/lib/dinheiro";

const RAPIDOS = [20, 50, 100, 200];

// Escolha de quantas fraldas doar. A cobrança Pix entra na fase 3 do plano;
// por enquanto o botão só mostra o valor.
export function Doar({ valorFraldaCentavos }: { valorFraldaCentavos: number }) {
  const [fraldas, setFraldas] = useState(50);
  const [cobrirTaxa, setCobrirTaxa] = useState(true);
  const { taxa, totalPago, paraOsPais } = calcularDoacao(fraldas, valorFraldaCentavos, cobrirTaxa);
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
          Quero que os pais recebam tudo
          <small className="block text-[13px] text-[var(--t-muted)]">
            {cobrirTaxa
              ? `Somo ${formatarReais(taxa)} para cobrir a taxa do Fraldômetro.`
              : `Sem marcar, os pais recebem ${formatarReais(paraOsPais)}.`}
          </small>
        </span>
      </label>
      <button type="button" className="tema-cta tema-display justify-self-start cursor-pointer px-[22px] py-[15px] text-lg leading-none">
        Doar {formatarReais(totalPago)} via Pix
      </button>
      <p className="text-[13.5px] text-[var(--t-muted)]">
        Cada fralda vale {formatarReais(valorFraldaCentavos)}, valor definido pelos pais. O Pix cai direto na conta da
        família.
      </p>
    </div>
  );
}
