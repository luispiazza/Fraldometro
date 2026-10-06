import { formatarNumero } from "@/lib/dinheiro";

// O fraldômetro: número grande e barra. A forma é a mesma em todos os temas.
export function Fraldometro({ total, meta, doadores }: { total: number; meta: number; doadores: number }) {
  const pct = meta > 0 ? Math.min(100, (total / meta) * 100) : 0;
  return (
    <div className="tema-card grid gap-3.5 p-[22px]" aria-live="polite">
      <div className="tema-display text-[clamp(40px,7vw,60px)] leading-none tabular-nums">
        {formatarNumero(total)}
        <small className="ml-1.5 font-[family-name:var(--t-body)] text-[15px] font-semibold tracking-normal text-[var(--t-muted)]">
          de {formatarNumero(meta)} fraldas
        </small>
      </div>
      <div className="tema-track relative h-[26px] overflow-hidden">
        <div className="tema-fill h-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap justify-between gap-1.5 text-sm text-[var(--t-muted)]">
        <span>{Math.floor(pct)}% da meta</span>
        <span>
          {formatarNumero(doadores)} {doadores === 1 ? "pessoa já doou" : "pessoas já doaram"}
        </span>
      </div>
    </div>
  );
}
