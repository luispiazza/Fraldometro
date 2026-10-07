"use client";

import { useState } from "react";
import { botaoSecundario } from "@/components/campos";
import { urlDaFoto } from "@/lib/pagina";
import { criarClienteNavegador } from "@/lib/supabase/navegador";

const LADO_MAX = 1200;

/** Reduz a foto para no máximo 1200px no lado maior e converte para JPEG. */
async function reduzir(arquivo: File): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, LADO_MAX / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  canvas.getContext("2d")!.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  imagem.close();
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error("toBlob"))), "image/jpeg", 0.85),
  );
}

// Envia a foto direto do navegador para o Storage, na pasta do usuário (fotos/<id>/...).
// O formulário só recebe o caminho, num campo escondido.
export function CampoFoto({ userId, inicial }: { userId: string; inicial: string | null }) {
  const [caminho, setCaminho] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const url = urlDaFoto(caminho);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const foto = await reduzir(arquivo);
      const novo = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await criarClienteNavegador()
        .storage.from("fotos")
        .upload(novo, foto, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) throw error;
      setCaminho(novo);
    } catch {
      setErro("Não deu para enviar essa foto. Tente outra.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold">Foto (opcional)</span>
      <div className="flex items-center gap-4">
        <div
          role="img"
          aria-label={url ? "Foto escolhida" : "Sem foto"}
          className="h-24 w-20 flex-none rounded-lg border border-line bg-chip bg-cover bg-center"
          style={url ? { backgroundImage: `url("${url}")` } : undefined}
        />
        <div className="grid justify-items-start gap-2">
          <label className={`${botaoSecundario} cursor-pointer text-sm ${enviando ? "opacity-50" : ""}`}>
            {enviando ? "Enviando…" : url ? "Trocar foto" : "Escolher foto"}
            <input type="file" accept="image/*" onChange={escolher} disabled={enviando} className="sr-only" />
          </label>
          {url && !enviando && (
            <button type="button" onClick={() => setCaminho(null)} className="text-sm text-muted hover:text-fg">
              Tirar a foto
            </button>
          )}
        </div>
      </div>
      {erro && <p role="alert" className="text-sm font-semibold text-[#c2410c]">{erro}</p>}
      <input type="hidden" name="fotoPath" value={caminho ?? ""} />
    </div>
  );
}
