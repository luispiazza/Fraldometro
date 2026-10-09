"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { TEMAS, type TemaId } from "@/themes";

// Abre a página de exemplo num lightbox, sem sair da home: no desktop num quadro de celular,
// no celular em tela cheia, com os três temas para trocar. Sem JavaScript, é um link comum.
export function LinkExemplo({ tema = "recortes", className, children }: { tema?: TemaId; className?: string; children: ReactNode }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [atual, setAtual] = useState<TemaId>(tema);
  const [aberto, setAberto] = useState(false);

  const abrir = (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // nova aba continua funcionando
    e.preventDefault();
    setAtual(tema);
    setAberto(true);
    dialogo.current?.showModal();
  };

  return (
    <>
      <a href={`/exemplo/${tema}`} onClick={abrir} className={className}>
        {children}
      </a>
      <dialog
        ref={dialogo}
        aria-label="Página de exemplo"
        onClose={() => setAberto(false)}
        // Clique fora do conteúdo (no fundo escurecido) fecha.
        onClick={(e) => e.target === e.currentTarget && dialogo.current?.close()}
        className="m-0 h-full max-h-none w-full max-w-none bg-[#fff6ef] p-0 text-[#26211f] backdrop:bg-[#26211f]/60 md:m-auto md:h-fit md:w-fit md:bg-transparent"
      >
        <div className="flex h-full flex-col md:h-auto md:items-center md:gap-4 md:p-6">
          <div className="flex items-center justify-between gap-3 border-b-[2.5px] border-[#26211f] px-3 py-2.5 md:rounded-2xl md:border-[2.5px] md:bg-[#fff6ef] md:shadow-[4px_4px_0_#26211f]">
            <div className="flex gap-1.5" role="group" aria-label="Estilo da página">
              {TEMAS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={atual === t.id}
                  onClick={() => setAtual(t.id)}
                  className="cursor-pointer rounded-full border-[2.5px] border-[#26211f] px-3.5 py-1.5 text-sm font-extrabold aria-pressed:bg-[#26211f] aria-pressed:text-white"
                >
                  {t.nome}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              aria-label="Fechar exemplo"
              className="grid h-10 w-10 flex-none cursor-pointer place-items-center rounded-full border-[2.5px] border-[#26211f] bg-white text-xl leading-none font-extrabold"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-hidden md:h-[min(780px,calc(100svh-9rem))] md:w-[390px] md:flex-none md:rounded-[44px] md:border-[10px] md:border-[#26211f] md:shadow-[6px_6px_0_#26211f]">
            {aberto && (
              <iframe
                key={atual}
                src={`/exemplo/${atual}`}
                title={`Página de exemplo no estilo ${TEMAS.find((t) => t.id === atual)?.nome}`}
                className="h-full w-full bg-white"
                // Os links de dentro (logo, "crie a página") abrem na janela principal, não no quadro.
                // O clique é pego antes do React do quadro; mexer nos <a> quebraria a hidratação.
                onLoad={(e) => {
                  e.currentTarget.contentDocument?.addEventListener(
                    "click",
                    (clique) => {
                      const link = (clique.target as Element).closest?.("a[href]");
                      if (!link) return;
                      clique.preventDefault();
                      clique.stopPropagation();
                      window.location.href = (link as HTMLAnchorElement).href;
                    },
                    true,
                  );
                }}
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
