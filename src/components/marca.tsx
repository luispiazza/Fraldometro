// Símbolo "Pilha": fraldas dobradas empilhadas, a de cima em destaque.
// O destaque usa --brand, que a página do bebê troca pela cor de destaque do tema.

export function Simbolo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`inline-block h-[1em] w-[1em] flex-none ${className}`}>
      <rect x="2" y="15.5" width="20" height="5" rx="2.5" fill="currentColor" />
      <rect x="3.8" y="9.6" width="16.4" height="5" rx="2.5" fill="currentColor" />
      <rect x="5.6" y="3.7" width="12.8" height="5" rx="2.5" style={{ fill: "var(--brand)" }} />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.32em] font-bold leading-none tracking-[-0.02em] ${className}`}>
      <Simbolo />
      fraldômetro
    </span>
  );
}
