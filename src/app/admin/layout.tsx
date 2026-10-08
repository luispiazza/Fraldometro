import type { Metadata } from "next";
import Link from "next/link";
import { sair } from "@/app/(site)/entrar/acoes";
import { Logo } from "@/components/marca";
import { exigirAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const perfil = await exigirAdmin();

  return (
    <>
      <header className="border-b border-line bg-surface">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="flex items-center gap-2 text-xl">
            <Logo />
            <span className="rounded-full bg-fg px-2 py-0.5 text-xs font-semibold text-bg">admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold whitespace-nowrap sm:gap-5">
            <Link href="/painel" className="hover:text-brand">
              Painel
            </Link>
            <span className="hidden text-muted sm:inline">{perfil.nome.split(" ")[0]}</span>
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
