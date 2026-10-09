// Peças das imagens de compartilhamento (og:image) e dos ícones, feitas com next/og.

import type { TemaId } from "@/themes";

export const TAMANHO_OG = { width: 1200, height: 630 };

/** Endereço público do site, para as URLs absolutas das tags de compartilhamento. */
export function urlDoSite(): URL {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicita) return new URL(explicita);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}

// O ImageResponse só lê ttf/otf/woff. Sem user agent de navegador, o Google Fonts entrega ttf.
const cache = new Map<string, Promise<ArrayBuffer>>();

export function fonteGoogle(familia: string, peso: number): Promise<ArrayBuffer> {
  const chave = `${familia}:${peso}`;
  const guardada = cache.get(chave);
  if (guardada) return guardada;
  const fonte = baixarFonte(familia, peso);
  fonte.catch(() => cache.delete(chave));
  cache.set(chave, fonte);
  return fonte;
}

async function baixarFonte(familia: string, peso: number): Promise<ArrayBuffer> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${familia.replaceAll(" ", "+")}:wght@${peso}`).then((r) =>
    r.text(),
  );
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error(`Fonte ${familia} ${peso} sem ttf no Google Fonts`);
  return fetch(url).then((r) => r.arrayBuffer());
}

// Espelho dos tokens de src/themes/temas.css que as imagens usam.
export const CORES_OG: Record<
  TemaId,
  { bg: string; surface: string; fg: string; muted: string; accent: string; track: string; fill: string; borda: string; display: [string, number]; texto: [string, number] }
> = {
  placar: {
    bg: "#16204a",
    surface: "#1e2a5c",
    fg: "#ffffff",
    muted: "#9fb0ff",
    accent: "#ffd23f",
    track: "#2c3a7a",
    fill: "#ffd23f",
    borda: "transparent",
    display: ["Bricolage Grotesque", 800],
    texto: ["Instrument Sans", 600],
  },
  diario: {
    bg: "#eef1ea",
    surface: "#ffffff",
    fg: "#2b2a33",
    muted: "#6c6a75",
    accent: "#5b3a6e",
    track: "#d6dccf",
    fill: "#5b3a6e",
    borda: "transparent",
    display: ["Young Serif", 400],
    texto: ["Instrument Sans", 600],
  },
  recortes: {
    bg: "#fff6ef",
    surface: "#ffffff",
    fg: "#26211f",
    muted: "#6b5f58",
    accent: "#ff5a36",
    track: "#ffe1d3",
    fill: "#7cc6ff",
    borda: "#26211f",
    display: ["Bagel Fat One", 400],
    texto: ["Nunito", 700],
  },
};

/** As fontes de um tema, já no formato do ImageResponse. */
export async function fontesDoTema(tema: TemaId) {
  const { display, texto } = CORES_OG[tema];
  return Promise.all(
    [display, texto].map(async ([name, weight]) => ({
      name,
      weight: weight as 400 | 600 | 700 | 800,
      style: "normal" as const,
      data: await fonteGoogle(name, weight),
    })),
  );
}

/** O símbolo da marca (pilha de fraldas) para o ImageResponse. */
export function SimboloOg({ tamanho, cor, destaque = "#ff6a3d" }: { tamanho: number; cor: string; destaque?: string }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <rect x="2" y="15.5" width="20" height="5" rx="2.5" fill={cor} />
      <rect x="3.8" y="9.6" width="16.4" height="5" rx="2.5" fill={cor} />
      <rect x="5.6" y="3.7" width="12.8" height="5" rx="2.5" fill={destaque} />
    </svg>
  );
}
