import Link from "next/link";
import { Logo } from "@/components/marca";

export default function NaoEncontrada() {
  return (
    <main className="mx-auto grid max-w-md flex-1 content-center justify-items-start gap-4 px-4 py-20">
      <Link href="/" className="text-xl">
        <Logo />
      </Link>
      <h1 className="titulo text-4xl leading-tight">Não achamos essa página</h1>
      <p className="text-muted">
        Se for a página de um bebê, confira o link com quem mandou. Ela pode ainda não ter sido publicada.
      </p>
      <Link href="/" className="titulo inline-flex items-center justify-center rounded-2xl border-[2.5px] border-fg bg-brand px-5 py-3.5 text-lg leading-none text-fg shadow-[4px_4px_0_var(--fg)]">
        Ir para o início
      </Link>
    </main>
  );
}
