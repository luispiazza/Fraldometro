import type { Metadata } from "next";
import Link from "next/link";
import { COMISSAO_BPS } from "@/lib/dinheiro";

export const metadata: Metadata = { title: "Como funciona" };

const comissao = `${COMISSAO_BPS / 100}%`;

const PERGUNTAS = [
  {
    p: "Para onde vai o dinheiro?",
    r: "Direto para a conta Mercado Pago de vocês. O Fraldômetro nunca guarda o dinheiro, e vocês usam o saldo ou transferem quando quiserem, pelo app do Mercado Pago.",
  },
  {
    p: "Quanto custa?",
    r: `Criar a página é grátis. Em cada doação, ${comissao} ficam com o Fraldômetro. O convidado pode marcar uma opção para somar essa taxa, e ela não sai das fraldas. O Mercado Pago cobra a taxa dele sobre cada Pix recebido.`,
  },
  {
    p: "Quem decide o valor de cada fralda?",
    r: "Vocês. Na criação da página, definem a meta de fraldas e quanto vale cada uma.",
  },
  {
    p: "Do que vocês precisam para receber?",
    r: "De uma conta Mercado Pago com chave Pix cadastrada. Vocês entram nela e autorizam o Fraldômetro a gerar os Pix das doações; a senha fica com o Mercado Pago. O nome do titular da conta aparece no Pix do convidado.",
  },
  {
    p: "A página aparece no Google?",
    r: "Não. Toda página do bebê nasce fora dos buscadores e só quem tem o link chega até ela.",
  },
];

export default function ComoFunciona() {
  return (
    <div className="mx-auto grid max-w-3xl gap-10 px-4 py-14">
      <header className="grid gap-4">
        <h1 className="text-[clamp(30px,5vw,46px)] leading-[1.05] font-bold tracking-[-0.02em] text-balance">Como funciona</h1>
        <p className="text-lg text-muted">
          Vocês criam a página do bebê, mandam o link e acompanham as fraldas doadas subirem no fraldômetro.
        </p>
      </header>

      <dl className="grid gap-6">
        {PERGUNTAS.map(({ p, r }) => (
          <div key={p} className="grid gap-1.5 border-b border-line pb-6">
            <dt className="text-lg font-semibold">{p}</dt>
            <dd className="text-muted">{r}</dd>
          </div>
        ))}
      </dl>

      <Link href="/exemplo/placar" className="justify-self-start rounded-full bg-fg px-5 py-3 font-semibold text-bg">
        Ver uma página de exemplo
      </Link>
    </div>
  );
}
