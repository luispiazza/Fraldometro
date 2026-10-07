import Link from "next/link";
import { Logo } from "@/components/marca";

export default function NaoEncontrada() {
  return (
    <main className="mx-auto grid max-w-md flex-1 content-center justify-items-start gap-4 px-4 py-20">
      <Link href="/" className="text-xl">
        <Logo />
      </Link>
      <h1 className="text-3xl font-bold tracking-[-0.02em]">Não achamos essa página</h1>
      <p className="text-muted">
        Se for a página de um bebê, confira o link com quem mandou. Ela pode ainda não ter sido publicada.
      </p>
      <Link href="/" className="rounded-full bg-fg px-5 py-3 font-semibold text-bg">
        Ir para o início
      </Link>
    </main>
  );
}
