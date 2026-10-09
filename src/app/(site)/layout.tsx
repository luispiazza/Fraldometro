import Link from "next/link";
import { Logo } from "@/components/marca";

// Cabeçalho e rodapé das páginas públicas, no mesmo visual da home.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-[300px] w-[300px] rounded-full bg-lilas" />
      <header className="relative z-[1] mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="font-sans text-xl">
          <Logo />
        </Link>
        <nav className="flex items-center gap-5 text-[15px] font-extrabold whitespace-nowrap">
          <Link href="/#como-funciona" className="hidden sm:inline">
            Como funciona
          </Link>
          <Link href="/#perguntas" className="hidden sm:inline">
            Perguntas
          </Link>
          <Link href="/entrar">Entrar</Link>
        </nav>
      </header>
      <main className="relative z-[1] flex-1">{children}</main>
      <footer className="relative z-[1] border-t-[2.5px] border-fg bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted">
          <Logo className="text-fg" />
          <span>Fraldas doadas via Pix, direto para a conta Mercado Pago da família.</span>
          <a href="mailto:contato@fraldometro.com.br" className="underline">
            contato@fraldometro.com.br
          </a>
        </div>
      </footer>
    </div>
  );
}
