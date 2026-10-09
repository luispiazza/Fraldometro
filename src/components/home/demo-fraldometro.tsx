"use client";

import { useState } from "react";
import { formatarNumero, formatarReais } from "@/lib/dinheiro";
import { Fraldometro } from "../fraldometro";

const JA_DOADAS = 2512;

// A página do Antonio num celular: o visitante arrasta e vê o fraldômetro subir.
export function DemoFraldometro() {
  const [fraldas, setFraldas] = useState(50);

  return (
    <div className="grid justify-items-center gap-3">
      <div className="w-full max-w-[340px] rounded-[40px] border-[2.5px] border-[#26211f] bg-[#26211f] p-2.5 shadow-[6px_6px_0_#26211f]">
        <div data-tema="placar" className="tema grid gap-3.5 rounded-[31px] px-4 pt-5 pb-4">
          <div className="flex justify-between text-xs text-[var(--t-muted)]">
            <span>fraldômetro</span>
            <span>Chá do Antonio</span>
          </div>
          <p className="tema-display text-[26px] leading-[1.05]">
            Oi, eu sou o <span className="text-[var(--t-accent)]">Antonio</span>. Chego em dezembro!
          </p>
          {/* No celular o número grande cabe menor, senão "de 4.000 fraldas" quebra. */}
          <div className="[&_.tema-display]:!text-[44px]">
            <Fraldometro total={JA_DOADAS + fraldas} meta={4000} doadores={51} />
          </div>
          <div className="tema-card grid gap-3 p-4">
            <label htmlFor="demo-fraldas" className="tema-display text-xl leading-none tabular-nums">
              {formatarNumero(fraldas)} fraldas
            </label>
            <input
              id="demo-fraldas"
              type="range"
              min={10}
              max={500}
              step={10}
              value={fraldas}
              onChange={(e) => setFraldas(Number(e.target.value))}
              className="w-full accent-[var(--t-accent)]"
            />
            <span className="tema-cta tema-display py-3 text-center text-base leading-none">
              Doar {formatarReais(fraldas * 200)} via Pix
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--t-muted)]">Arraste e veja o fraldômetro subir</p>
    </div>
  );
}
