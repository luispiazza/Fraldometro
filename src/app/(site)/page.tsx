import Link from "next/link";
import { TEMAS } from "@/themes";

const PASSOS = [
  { titulo: "Crie a página do bebê", texto: "Nome, foto, recado e a meta de fraldas. Depois, é só conectar a conta Mercado Pago de vocês." },
  { titulo: "Mande o link no grupo", texto: "Amigos e família abrem no celular e escolhem quantas fraldas doar." },
  { titulo: "O Pix cai no Mercado Pago de vocês", texto: "Cada doação vai direto para a conta da família, e o fraldômetro sobe na hora." },
];

export default function Inicio() {
  return (
    <div className="mx-auto grid max-w-5xl gap-16 px-4 py-14">
      <section className="grid max-w-3xl gap-5">
        <span className="text-xs font-semibold tracking-[0.1em] text-brand uppercase">Chá de fraldas, sem pilha de pacotes</span>
        <h1 className="text-[clamp(34px,6vw,56px)] leading-[1.04] font-bold tracking-[-0.02em] text-balance">
          Até os 2 anos, um bebê usa umas 4.000 fraldas. Deixa a família ajudar.
        </h1>
        <p className="max-w-[60ch] text-lg text-muted">
          O Fraldômetro é a página do bebê onde quem gosta de vocês doa fraldas via Pix. Vocês compram a marca e o
          tamanho certos, na hora certa.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/como-funciona" className="rounded-full bg-fg px-5 py-3 font-semibold text-bg">
            Como funciona
          </Link>
          <Link href="/exemplo/placar" className="rounded-full border border-line bg-surface px-5 py-3 font-semibold">
            Ver uma página de exemplo
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {PASSOS.map((p, i) => (
          <div key={p.titulo} className="grid content-start gap-2 rounded-xl border border-line bg-surface p-5">
            <span className="text-sm font-semibold text-brand">{i + 1}</span>
            <h2 className="text-lg font-semibold">{p.titulo}</h2>
            <p className="text-muted">{p.texto}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5">
        <h2 className="text-2xl font-bold tracking-[-0.01em]">Três temas, o mesmo fraldômetro</h2>
        <div className="flex flex-wrap gap-3">
          {TEMAS.map((t) => (
            <Link
              key={t.id}
              href={`/exemplo/${t.id}`}
              className="flex items-center gap-2.5 rounded-full border-[1.5px] border-line bg-surface py-2 pr-4 pl-2 font-semibold"
            >
              <span className="flex">
                {t.amostras.map((cor) => (
                  <i key={cor} className="-ml-1.5 h-5 w-5 rounded-full border-2 border-surface first:ml-0" style={{ background: cor }} />
                ))}
              </span>
              {t.nome}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
