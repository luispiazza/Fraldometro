// Peças de formulário do site e do painel.

export const campo =
  "w-full rounded-lg border-[1.5px] border-line bg-surface px-3.5 py-3 text-base outline-none focus:border-fg";

export const botao =
  "rounded-full bg-fg px-5 py-3 font-semibold text-bg disabled:opacity-50";

export const botaoSecundario =
  "rounded-full border border-line bg-surface px-5 py-3 font-semibold disabled:opacity-50";

export function Rotulo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      {texto}
      {children}
    </label>
  );
}

export function Mensagem({ erro, aviso }: { erro?: string; aviso?: string }) {
  if (erro) return <p role="alert" className="text-sm font-semibold text-[#c2410c]">{erro}</p>;
  if (aviso) return <p role="status" className="text-sm text-muted">{aviso}</p>;
  return null;
}
