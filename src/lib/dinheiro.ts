// Valores em dinheiro sempre em centavos, como número inteiro.

/** Comissão da plataforma, em pontos-base (500 = 5%). Percentual final ainda em aberto no plano. */
export const COMISSAO_BPS = 500;

export function comissao(centavos: number): number {
  return Math.round((centavos * COMISSAO_BPS) / 10_000);
}

/**
 * Quanto o convidado paga e quanto chega aos pais.
 * Se o convidado cobrir a taxa, a comissão é somada ao valor; senão, sai do valor.
 */
export function calcularDoacao(fraldas: number, valorFraldaCentavos: number, cobrirTaxa: boolean) {
  const valor = fraldas * valorFraldaCentavos;
  const taxa = comissao(valor);
  return {
    valor,
    taxa,
    totalPago: cobrirTaxa ? valor + taxa : valor,
    paraOsPais: cobrirTaxa ? valor : valor - taxa,
  };
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const inteiro = new Intl.NumberFormat("pt-BR");

export function formatarReais(centavos: number): string {
  return brl.format(centavos / 100);
}

export function formatarNumero(n: number): string {
  return inteiro.format(n);
}

/** Um bebê usa cerca de 6 fraldas por dia em média. */
export function diasDeFralda(fraldas: number): number {
  return Math.max(1, Math.round(fraldas / 6));
}
