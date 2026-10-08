"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Confere o status a cada poucos segundos e recarrega a tela quando o Pix cai.
export function Aguardando({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    let ativo = true;
    const conferir = async () => {
      const r = await fetch(`/api/doacoes/${id}`, { cache: "no-store" }).catch(() => null);
      const { status } = (await r?.json().catch(() => ({}))) ?? {};
      if (ativo && status && status !== "aguardando") router.refresh();
    };
    const timer = setInterval(conferir, 4000);
    return () => {
      ativo = false;
      clearInterval(timer);
    };
  }, [id, router]);
  return null;
}

export function CopiaECola({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="grid gap-2">
      <code className="block max-h-24 overflow-auto rounded-lg border-[1.5px] border-[var(--t-track)] p-3 text-xs break-all">
        {codigo}
      </code>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(codigo);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2500);
        }}
        className="tema-cta tema-display justify-self-start cursor-pointer px-[22px] py-[13px] text-base leading-none"
      >
        {copiado ? "Copiado!" : "Copiar código Pix"}
      </button>
    </div>
  );
}
