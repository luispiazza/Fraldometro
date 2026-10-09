"use client";

import { startTransition, useActionState, useState } from "react";
import { botao, campo, Mensagem, Rotulo } from "@/components/campos";
import { formatarReais } from "@/lib/dinheiro";
import { gerarSlug, reaisParaCentavos, type Sexo } from "@/lib/pagina";
import { TEMAS } from "@/themes";
import type { EstadoPagina } from "./acoes-pagina";
import { CampoFoto } from "./campo-foto";

export type ValoresPagina = {
  nomeBebe: string;
  sexo: Sexo;
  jaNasceu: boolean;
  mesPrevisto: string; // "2026-12"
  fotoPath: string | null;
  recado: string;
  tema: string;
  metaFraldas: number;
  valorFralda: string; // "2,00"
  encerraEm: string; // "2026-12-20"
  slug: string;
};

const SEXOS: { id: Sexo; nome: string }[] = [
  { id: "menino", nome: "Menino" },
  { id: "menina", nome: "Menina" },
  { id: "surpresa", nome: "Surpresa" },
];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 cartao p-5">
      <legend className="px-1 text-lg font-semibold">{titulo}</legend>
      {children}
    </fieldset>
  );
}

export function FormPagina({
  inicial,
  userId,
  dominio,
  acao,
  textoBotao,
}: {
  inicial: ValoresPagina;
  userId: string;
  dominio: string;
  acao: (estado: EstadoPagina, form: FormData) => Promise<EstadoPagina>;
  textoBotao: string;
}) {
  const [estado, enviar, salvando] = useActionState(acao, {});
  const [nome, setNome] = useState(inicial.nomeBebe);
  const [slug, setSlug] = useState(inicial.slug);
  const [slugEditado, setSlugEditado] = useState(Boolean(inicial.slug));
  const [jaNasceu, setJaNasceu] = useState(inicial.jaNasceu);
  const [meta, setMeta] = useState(String(inicial.metaFraldas));
  const [valor, setValor] = useState(inicial.valorFralda);

  const centavos = reaisParaCentavos(valor);
  const totalMeta = Number(meta) * centavos;
  const invalido = (nomeCampo: string) => (estado.campo === nomeCampo ? "border-[#c2410c]" : "");

  // Envio manual (sem `action` no form) para o React não limpar os campos quando houver erro.
  function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    startTransition(() => enviar(dados));
  }

  return (
    <form onSubmit={aoEnviar} className="grid gap-6">
      <Secao titulo="O bebê">
        <Rotulo texto="Nome (ou apelido)">
          <input
            name="nomeBebe"
            required
            maxLength={60}
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (!slugEditado) setSlug(gerarSlug(e.target.value));
            }}
            className={`${campo} ${invalido("nomeBebe")}`}
          />
        </Rotulo>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold">É…</span>
          <div className="flex flex-wrap gap-2">
            {SEXOS.map((s) => (
              <label key={s.id} className="cursor-pointer">
                <input type="radio" name="sexo" value={s.id} defaultChecked={inicial.sexo === s.id} className="peer sr-only" />
                <span className="block rounded-full border-[1.5px] border-line bg-surface px-4 py-2 font-semibold peer-checked:border-fg peer-checked:bg-fg peer-checked:text-bg peer-focus-visible:outline-2">
                  {s.nome}
                </span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm">
          <input
            name="jaNasceu"
            type="checkbox"
            checked={jaNasceu}
            onChange={(e) => setJaNasceu(e.target.checked)}
            className="h-4 w-4 accent-[var(--brand)]"
          />
          Já nasceu
        </label>

        <Rotulo texto={jaNasceu ? "Mês em que nasceu" : "Mês previsto para nascer"}>
          <input name="mesPrevisto" type="month" defaultValue={inicial.mesPrevisto} className={`${campo} ${invalido("mesPrevisto")}`} />
        </Rotulo>

        <CampoFoto userId={userId} inicial={inicial.fotoPath} />
      </Secao>

      <Secao titulo="A página">
        <Rotulo texto="Recado para os convidados (opcional)">
          <textarea
            name="recado"
            rows={3}
            maxLength={280}
            defaultValue={inicial.recado}
            placeholder="Pelas minhas contas, até os 2 anos vou usar umas 4.000 fraldas. Quer cuidar de algumas?"
            className={`${campo} ${invalido("recado")}`}
          />
        </Rotulo>

        <div className="grid gap-1.5">
          <span className="text-sm font-semibold">Tema</span>
          <div className="flex flex-wrap gap-2">
            {TEMAS.map((t) => (
              <label key={t.id} className="cursor-pointer">
                <input type="radio" name="tema" value={t.id} defaultChecked={inicial.tema === t.id} className="peer sr-only" />
                <span className="flex items-center gap-2.5 rounded-full border-[1.5px] border-line bg-surface py-2 pr-4 pl-2 font-semibold peer-checked:border-fg peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:outline-2">
                  <span className="flex">
                    {t.amostras.map((cor) => (
                      <i key={cor} className="-ml-1.5 h-5 w-5 rounded-full border-2 border-surface first:ml-0" style={{ background: cor }} />
                    ))}
                  </span>
                  {t.nome}
                </span>
              </label>
            ))}
          </div>
          <a href="/exemplo/placar" target="_blank" className="justify-self-start text-sm text-muted underline hover:text-fg">
            Ver os temas num exemplo
          </a>
        </div>
      </Secao>

      <Secao titulo="A meta">
        <div className="grid gap-4 sm:grid-cols-2">
          <Rotulo texto="Meta de fraldas">
            <input
              name="metaFraldas"
              type="number"
              inputMode="numeric"
              min={50}
              max={20000}
              step={10}
              required
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              className={`${campo} ${invalido("metaFraldas")}`}
            />
          </Rotulo>
          <Rotulo texto="Quanto vale cada fralda (R$)">
            <input
              name="valorFralda"
              inputMode="decimal"
              required
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={`${campo} ${invalido("valorFralda")}`}
            />
          </Rotulo>
        </div>
        {totalMeta > 0 && (
          <p className="text-sm text-muted">
            Batendo a meta, são <strong className="text-fg">{formatarReais(totalMeta)}</strong> para comprar fraldas.
          </p>
        )}
        <Rotulo texto="As doações vão até (opcional)">
          <input name="encerraEm" type="date" defaultValue={inicial.encerraEm} className={`${campo} ${invalido("encerraEm")}`} />
        </Rotulo>
      </Secao>

      <Secao titulo="O link">
        <Rotulo texto="O endereço que vocês vão mandar no grupo">
          <div className={`flex items-center overflow-hidden rounded-lg border-[1.5px] border-line bg-surface focus-within:border-fg ${invalido("slug")}`}>
            <span className="truncate py-3 pl-3.5 text-muted">{dominio}/</span>
            <input
              name="slug"
              required
              maxLength={40}
              value={slug}
              onChange={(e) => {
                setSlugEditado(true);
                setSlug(e.target.value.toLowerCase());
              }}
              onBlur={() => setSlug(gerarSlug(slug))}
              className="min-w-0 flex-1 bg-transparent py-3 pr-3.5 outline-none"
            />
          </div>
        </Rotulo>
      </Secao>

      <div className="grid justify-items-start gap-3">
        <Mensagem erro={estado.erro} aviso={estado.salvo ? "Alterações salvas." : undefined} />
        <button disabled={salvando} className={botao}>
          {salvando ? "Salvando…" : textoBotao}
        </button>
      </div>
    </form>
  );
}
