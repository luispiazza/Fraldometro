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
          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/como-funciona" className="hover:text-brand">
              Como funciona
            </Link>
            <Link href="/exemplo/placar" className="hover:text-brand">
              Ver exemplo
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
          <Logo />
          <span>Fraldas doadas via Pix, direto para a conta da família.</span>
        </div>
      </footer>
    </>
  );
}
