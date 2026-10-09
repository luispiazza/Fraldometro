"use client";

import { useEffect, useRef, type ComponentProps } from "react";

// Muda a cor de fundo aos poucos conforme a rolagem: cada <section data-fundo="#hex">
// tem a sua cor, e perto da divisa entre duas seções o fundo é a mistura das duas.
export function FundoRolagem({ inicial, style, ...props }: ComponentProps<"div"> & { inicial: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const secoes = [...raiz.querySelectorAll<HTMLElement>("[data-fundo]")];
    const cores = secoes.map((s) => rgb(s.dataset.fundo!));
    let quadro = 0;

    // Cada divisa entre duas seções faz a troca enquanto sobe de 75% a 30% da altura da tela.
    const pintar = () => {
      quadro = 0;
      const h = window.innerHeight;
      let cor = cores[0];
      for (let i = 0; i < secoes.length - 1; i++) {
        const divisa = secoes[i].getBoundingClientRect().bottom;
        const t = Math.min(1, Math.max(0, (0.75 * h - divisa) / (0.45 * h)));
        if (t > 0) cor = misturar(cor, cores[i + 1], t);
      }
      raiz.style.backgroundColor = `rgb(${cor.join(",")})`;
    };
    const agendar = () => {
      if (!quadro) quadro = requestAnimationFrame(pintar);
    };

    pintar();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
    };
  }, []);

  return (
    <div ref={ref} {...props} style={{ ...style, backgroundColor: inicial }} />
  );
}

function rgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function misturar(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}
