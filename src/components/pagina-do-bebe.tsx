import Link from "next/link";
import type { TemaId } from "@/themes";
import { formatarNumero } from "@/lib/dinheiro";
import { artigo, contracao, type Sexo } from "@/lib/pagina";
import { Doar, type AcaoDoar } from "./doar";
import { Fraldometro } from "./fraldometro";
import { Logo } from "./marca";

export type DadosPagina = {
  nomeBebe: string;
  sexo: Sexo;
  jaNasceu: boolean;
  tema: TemaId;
  chegada: string | null; // ex.: "dezembro"
  recado: string | null;
  encerraEm: string | null; // ex.: "20 de dezembro"
  fotoUrl: string | null;
  metaFraldas: number;
  valorFraldaCentavos: number;
  totalFraldas: number;
  doadores: number;
};

const CONSUMO = [
  { tamanho: "RN", idade: "0 a 40 dias", porDia: "8 a 7", fraldas: 320 },
  { tamanho: "P", idade: "2 a 4 m", porDia: "6", fraldas: 440 },
  { tamanho: "M", idade: "5 a 10 m", porDia: "5", fraldas: 920 },
  { tamanho: "G", idade: "11 a 20 m", porDia: "5", fraldas: 1200 },
  { tamanho: "XG", idade: "21 a 26 m", porDia: "4", fraldas: 720 },
  { tamanho: "XXG", idade: "26 m +", porDia: "4", fraldas: 480 },
];

const LINHAS: [string, (c: (typeof CONSUMO)[number]) => string][] = [
  ["Idade", (c) => c.idade],
  ["Por dia", (c) => c.porDia],
  ["Fraldas", (c) => formatarNumero(c.fraldas)],
];

// Uma estrutura só; o tema muda apenas os tokens (ver src/themes/temas.css).
export function PaginaDoBebe({ dados, acaoDoar }: { dados: DadosPagina; acaoDoar?: AcaoDoar }) {
  const de = contracao(dados.sexo);
  const art = artigo(dados.sexo);
  const chegada = dados.chegada && (dados.jaNasceu ? `Cheguei em ${dados.chegada}!` : `Chego em ${dados.chegada}!`);

  return (
    <div
      data-tema={dados.tema}
      className="tema relative min-h-full flex-1 overflow-hidden"
      style={{ ["--brand" as string]: "var(--t-accent)" }}
    >
      {dados.tema === "recortes" && (
        <>
          <div aria-hidden className="pointer-events-none absolute -top-20 -right-[70px] h-[220px] w-[220px] rounded-full bg-[#b9a6ff]" />
          <div aria-hidden className="pointer-events-none absolute bottom-0 -left-5 h-20 w-40 rounded-t-[160px] bg-[#ffc531]" />
        </>
      )}

      <div className="relative z-[1] mx-auto grid max-w-[760px] gap-7 px-5 pt-7">
        <header className="flex items-center justify-between gap-3 text-[13px] text-[var(--t-muted)]">
          <Link href="/" className="text-base text-[var(--t-fg)]">
            <Logo />
          </Link>
          <span>
            Chá {de} {dados.nomeBebe}
            {dados.encerraEm && ` · até ${dados.encerraEm}`}
          </span>
        </header>

        <section className="grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div
            role="img"
            aria-label={`Foto ${de} ${dados.nomeBebe}`}
            className="h-[var(--t-photo-h)] w-[var(--t-photo-w)] border-[length:var(--t-border)] border-[var(--t-line)] bg-[var(--t-track)] bg-cover bg-center"
            style={{
              borderRadius: "var(--t-photo-radius)",
              // Sem foto, o tema desenha um bebê genérico com a cor de destaque.
              backgroundImage: dados.fotoUrl
                ? `url("${dados.fotoUrl}")`
                : "radial-gradient(circle at 50% 72%, var(--t-accent) 0 30%, transparent 31%)",
              boxShadow: "var(--t-shadow)",
            }}
          />
          <div>
            <h1 className="tema-display text-[clamp(30px,5vw,46px)] leading-[1.04] text-balance">
              Oi, eu sou {art && `${art} `}
              <em className="tema-destaque not-italic text-[var(--t-accent)]">{dados.nomeBebe}</em>.{chegada && ` ${chegada}`}
            </h1>
            {dados.recado && <p className="mt-2 max-w-[44ch] whitespace-pre-line text-[var(--t-muted)]">{dados.recado}</p>}
          </div>
        </section>

        <Fraldometro total={dados.totalFraldas} meta={dados.metaFraldas} doadores={dados.doadores} />
        <Doar valorFraldaCentavos={dados.valorFraldaCentavos} acao={acaoDoar} />

        <section className="grid gap-3">
          <h2 className="tema-display text-[22px] leading-tight">Por que {formatarNumero(dados.metaFraldas)}?</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm tabular-nums">
              <thead>
                <tr>
                  <th className="border-b border-[var(--t-track)] p-2" />
                  {CONSUMO.map((c) => (
                    <th key={c.tamanho} className="tema-display border-b border-[var(--t-track)] p-2 text-base text-[var(--t-accent)]">
                      {c.tamanho}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LINHAS.map(([rotulo, valor]) => (
                  <tr key={rotulo}>
                    <td className="border-b border-[var(--t-track)] p-2 text-left text-[13px] text-[var(--t-muted)]">{rotulo}</td>
                    {CONSUMO.map((c) => (
                      <td key={c.tamanho} className="whitespace-nowrap border-b border-[var(--t-track)] p-2 text-center">
                        {valor(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer className="relative z-[1] mt-10 flex items-center justify-center gap-1.5 border-t border-[var(--t-track)] px-5 py-4 font-sans text-[13px] text-[var(--t-muted)]">
        feito com
        <Link href="/" className="text-[var(--t-fg)]">
          <Logo />
        </Link>
        · <Link href="/entrar" className="underline">crie a página do seu bebê</Link>
      </footer>
    </div>
  );
}
