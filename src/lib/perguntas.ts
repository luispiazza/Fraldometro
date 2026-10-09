// Perguntas frequentes, usadas na home e em /como-funciona.

import { COMISSAO_BPS } from "@/lib/dinheiro";

const comissao = `${COMISSAO_BPS / 100}%`;

export const PERGUNTAS = [
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
