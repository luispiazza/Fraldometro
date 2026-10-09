// Peças de formulário do site e do painel.

export const campo =
  "w-full rounded-xl border-[2.5px] border-fg bg-surface px-3.5 py-3 text-base outline-none focus:shadow-[3px_3px_0_var(--fg)]";

export const botao =
  "titulo inline-flex items-center justify-center rounded-2xl border-[2.5px] border-fg bg-brand px-5 py-3.5 text-lg leading-none text-fg shadow-[4px_4px_0_var(--fg)] disabled:opacity-50";

export const botaoSecundario =
  "inline-flex items-center justify-center rounded-2xl border-[2.5px] border-fg bg-surface px-5 py-3 font-extrabold leading-none disabled:opacity-50";

export function Rotulo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-extrabold">
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
