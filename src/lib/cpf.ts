/** Só os dígitos. */
export const digitos = (texto: string) => texto.replace(/\D/g, "");

/** Confere os dígitos verificadores do CPF. */
export function cpfValido(texto: string): boolean {
  const cpf = digitos(texto);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(cpf[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(cpf[9]) && dv(10) === Number(cpf[10]);
}
