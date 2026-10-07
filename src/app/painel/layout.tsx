import Link from "next/link";
import { sair } from "@/app/(site)/entrar/acoes";
import { Logo } from "@/components/marca";
import { exigirPerfil } from "@/lib/auth";

export default async function PainelLayout({ children }: LayoutProps<"/painel">) {
  const perfil = await exigirPerfil();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/painel" className="text-xl">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold whitespace-nowrap sm:gap-5">
            <Link href="/painel" className="hover:text-brand">
              Minhas páginas
            </Link>
            <Link href="/painel/conta" className="hover:text-brand">
              {perfil.nome.split(" ")[0]}
            </Link>
            <form action={sair}>
              <button className="text-muted hover:text-fg">Sair</button>
            </form>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
