import Link from "next/link";
import type { ReactNode } from "react";
import { DemoFraldometro } from "@/components/home/demo-fraldometro";
import { FundoRolagem } from "@/components/home/fundo-rolagem";
import { Logo } from "@/components/marca";
import { CONSUMO } from "@/lib/consumo";
import { COMISSAO_BPS, formatarNumero } from "@/lib/dinheiro";
import { PERGUNTAS } from "@/lib/perguntas";
import "./home.css";

// A home no visual do tema Recortes. Sem divisórias: o fundo muda de cor aos poucos
// entre as seções (FundoRolagem) e alguns elementos se mexem com a rolagem (home.css).

const comissao = `${COMISSAO_BPS / 100}%`;

const FUNDO = {
  creme: "#fff6ef",
  lavanda: "#eee8ff",
  pessego: "#ffe4d6",
  amarelo: "#ffc531",
};

const PASSOS = [
  { titulo: "Crie a página do bebê", texto: "Nome, foto, recado e a meta de fraldas. Depois, conecte a conta Mercado Pago de vocês." },
  { titulo: "Mande o link no grupo", texto: "Amigos e família abrem no celular e escolhem quantas fraldas doar." },
  { titulo: "O Pix cai no Mercado Pago de vocês", texto: "Cada doação vai direto para a conta da família, e o fraldômetro sobe na hora." },
];

// Pilha do maior (embaixo) para o menor (em cima), como o símbolo da marca.
const PILHA = [...CONSUMO].sort((a, b) => a.fraldas - b.fraldas);
const MAIOR = Math.max(...CONSUMO.map((c) => c.fraldas));

const titulo2 = "tema-display text-[clamp(32px,4.4vw,52px)] leading-[1.04] text-balance";
const texto = "max-w-[44ch] text-lg leading-relaxed text-[var(--t-muted)]";
const botao = "tema-cta tema-display inline-flex items-center justify-center px-6 py-4 text-lg leading-none";
const botaoSecundario =
  "inline-flex items-center justify-center rounded-2xl border-[2.5px] border-[#26211f] bg-white px-6 py-4 font-extrabold leading-none";

export default function Inicio() {
  return (
    <FundoRolagem
      inicial={FUNDO.creme}
      data-tema="recortes"
      className="tema relative flex-1 overflow-x-clip"
      // Texto escuro no botão laranja: o branco do tema fica abaixo do contraste mínimo.
      style={{ ["--t-cta-fg" as string]: "#26211f" }}
    >
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-[300px] w-[300px] rounded-full bg-[#b9a6ff]" />

        <header className="relative z-[1] mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 text-[var(--t-fg)]">
          <Link href="/" className="font-sans text-xl">
            <Logo />
          </Link>
          <nav className="flex items-center gap-5 text-[15px] font-extrabold whitespace-nowrap">
            <a href="#como-funciona" className="hidden sm:inline">
              Como funciona
            </a>
            <a href="#perguntas" className="hidden sm:inline">
              Perguntas
            </a>
            <Link href="/entrar">Entrar</Link>
          </nav>
        </header>

        <main className="relative z-[1] text-[var(--t-fg)]">
          {/* A. O produto na mão */}
          <section data-fundo={FUNDO.creme} className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-8 pb-20 md:min-h-[calc(100svh-5rem)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="grid justify-items-start gap-5">
              <h1 className="tema-display text-[clamp(42px,6vw,72px)] leading-[0.98] text-balance">
                Chá de fraldas sem pilha de pacotes.
              </h1>
              <p className={texto}>
                Amigos e família doam fraldas via Pix numa página do bebê. Vocês compram a marca e o tamanho certos, quando
                precisarem.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link href="/entrar" className={botao}>
                  Criar a página do bebê
                </Link>
                <Link href="/exemplo/recortes" className={botaoSecundario}>
                  Ver um exemplo
                </Link>
              </div>
              <p className="max-w-[52ch] text-sm text-[var(--t-muted)]">
                Grátis para criar. {comissao} por doação, e o convidado pode cobrir. O Pix cai na conta Mercado Pago de vocês.
              </p>
            </div>
            <div className="home-afasta">
              <DemoFraldometro />
            </div>
          </section>

          {/* B. A pilha */}
          <section data-fundo={FUNDO.lavanda} className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-28 md:grid-cols-2">
            <div className="home-surge grid gap-5">
              <h2 className={titulo2}>Um bebê usa umas 4.000 fraldas. Mais da metade é M e G.</h2>
              <p className={texto}>
                Com o Pix, vocês compram cada tamanho quando chegar a hora, em vez de acumular pacotes de um tamanho só.
              </p>
            </div>
            <ol className="home-pilha grid justify-items-center gap-2" aria-label="Fraldas por tamanho">
              {PILHA.map((c, i) => (
                <li
                  key={c.tamanho}
                  className={`flex h-12 min-w-[7.5rem] items-center justify-between rounded-full border-[2.5px] border-[#26211f] px-4 font-extrabold tabular-nums shadow-[3px_3px_0_#26211f] ${
                    c.tamanho === "M" || c.tamanho === "G" ? "bg-[#7cc6ff]" : "bg-white"
                  }`}
                  style={{ width: `${(c.fraldas / MAIOR) * 100}%`, ["--ordem" as string]: PILHA.length - 1 - i }}
                >
                  <span>{c.tamanho}</span>
                  <span>{formatarNumero(c.fraldas)}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* C. No grupo da família */}
          <section data-fundo={FUNDO.pessego} className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-28 md:grid-cols-2">
            <div className="home-surge grid justify-items-start gap-5 md:order-2">
              <h2 className={titulo2}>Manda o link no grupo. As fraldas vêm via Pix.</h2>
              <p className={texto}>
                Cada um escolhe quantas fraldas doar e vê quantos dias de fralda está dando. O fraldômetro sobe para todo
                mundo ver a meta chegando.
              </p>
              <Link href="/exemplo/placar" className="font-extrabold underline decoration-2 underline-offset-4">
                Ver os três estilos de página
              </Link>
            </div>
            <Conversa />
          </section>

          {/* Como funciona */}
          <section id="como-funciona" data-fundo={FUNDO.creme} className="mx-auto grid max-w-6xl scroll-mt-6 gap-10 px-5 py-28">
            <h2 className={`home-surge ${titulo2}`}>Como funciona</h2>
            <ol className="grid gap-5 md:grid-cols-3">
              {PASSOS.map((p, i) => (
                <li key={p.titulo} className="home-surge tema-card grid content-start gap-2 p-6">
                  <span className="tema-display grid h-10 w-10 place-items-center rounded-full border-[2.5px] border-[#26211f] bg-[#ffc531] text-lg">
                    {i + 1}
                  </span>
                  <h3 className="mt-2 text-xl font-extrabold">{p.titulo}</h3>
                  <p className="text-[var(--t-muted)]">{p.texto}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Perguntas */}
          <section id="perguntas" data-fundo={FUNDO.creme} className="mx-auto grid max-w-3xl scroll-mt-6 gap-8 px-5 py-20">
            <h2 className={`home-surge ${titulo2}`}>Perguntas</h2>
            <div className="grid gap-3">
              {PERGUNTAS.map(({ p, r }) => (
                <details key={p} className="tema-card group p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-extrabold">
                    {p}
                    <span aria-hidden className="tema-display text-2xl leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-[var(--t-muted)]">{r}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Fechamento */}
          <section data-fundo={FUNDO.amarelo} className="mx-auto grid min-h-[65vh] max-w-6xl content-center justify-items-start gap-6 px-5 py-24">
            <h2 className="home-surge tema-display max-w-[16ch] text-[clamp(36px,5.4vw,64px)] leading-[1.02]">
              Faça a página do bebê antes do chá
            </h2>
            <Link href="/entrar" className={botao}>
              Criar a página do bebê
            </Link>
          </section>
        </main>

        <footer className="relative z-[1] border-t-[2.5px] border-[#26211f] bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 font-sans text-sm text-[var(--t-muted)]">
            <Logo className="text-[var(--t-fg)]" />
            <span>Fraldas doadas via Pix, direto para a conta Mercado Pago da família.</span>
            <a href="mailto:contato@fraldometro.com.br" className="underline">
              contato@fraldometro.com.br
            </a>
          </div>
        </footer>
    </FundoRolagem>
  );
}

// Ilustração: uma conversa de família recebendo o link. Nomes inventados.
function Conversa() {
  return (
    <figure className="home-conversa tema-card grid w-full max-w-[420px] gap-2.5 justify-self-center p-4 shadow-[6px_6px_0_#26211f]">
      <figcaption className="sr-only">Exemplo de conversa no grupo da família quando o link do chá é compartilhado.</figcaption>
      <div className="flex items-center gap-2.5 border-b-2 border-[var(--t-track)] pb-3">
        <span aria-hidden className="h-9 w-9 rounded-full border-2 border-[#26211f] bg-[#ffc531]" />
        <div className="leading-tight">
          <b>Família Souza</b>
          <small className="block text-xs text-[var(--t-muted)]">12 participantes</small>
        </div>
      </div>
      <div className="max-w-[86%] justify-self-end rounded-2xl bg-[#ffe1d3] px-3 py-2.5 text-[15px]">
        Gente, o chá do Antonio vai ser assim
        <div className="mt-2 grid gap-1.5 rounded-xl border-2 border-[#26211f] bg-white px-3 py-2.5">
          <b className="tema-display">Chá do Antonio</b>
          <div className="h-3 overflow-hidden rounded-full border-2 border-[#26211f] bg-[#ffe1d3]">
            <div className="h-full w-[63%] border-r-2 border-[#26211f] bg-[#7cc6ff]" />
          </div>
          <span className="text-xs text-[var(--t-muted)]">2.512 de 4.000 fraldas</span>
        </div>
      </div>
      <Mensagem nome="Tia Cris">Doei 100! Escolhe as melhores pra ele</Mensagem>
      <span className="justify-self-center rounded-full bg-[var(--t-bg)] px-3 py-1 text-xs font-bold text-[var(--t-muted)]">
        + 100 fraldas no fraldômetro
      </span>
      <Mensagem nome="Vô Zé">Mandei 200. Quero ver chegar em 4 mil</Mensagem>
    </figure>
  );
}

function Mensagem({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <p className="max-w-[86%] rounded-2xl bg-[#fff1e8] px-3 py-2.5 text-[15px]">
      <b className="block text-xs text-[#9a3412]">{nome}</b>
      {children}
    </p>
  );
}
