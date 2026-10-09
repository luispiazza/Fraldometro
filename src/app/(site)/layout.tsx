import Link from "next/link";
import { Logo } from "@/components/marca";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="text-xl">
            <Logo />
          </Link>
          <div className="flex items-center gap-4 text-sm font-semibold whitespace-nowrap sm:gap-5">
            <Link href="/como-funciona" className="hover:text-brand">
              Como funciona
            </Link>
            <Link href="/exemplo/placar" className="hidden hover:text-brand sm:inline">
              Ver exemplo
            </Link>
            <Link href="/entrar" className="rounded-full bg-fg px-4 py-2 text-bg">
              Entrar
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
          <Logo />
          <span>Fraldas doadas via Pix, direto para a conta Mercado Pago da família.</span>
        </div>
      </footer>
    </>
  );
}
