import type { Metadata } from "next";
import { headers } from "next/headers";
import { exigirPerfil } from "@/lib/auth";
import { TEMA_PADRAO } from "@/themes";
import { criarPagina } from "../acoes-pagina";
import { FormPagina, type ValoresPagina } from "../form-pagina";

export const metadata: Metadata = { title: "Criar a página do bebê" };

const INICIAL: ValoresPagina = {
  nomeBebe: "",
  sexo: "surpresa",
  jaNasceu: false,
  mesPrevisto: "",
  fotoPath: null,
  recado: "",
  tema: TEMA_PADRAO,
  metaFraldas: 4000,
  valorFralda: "2,00",
  encerraEm: "",
  slug: "",
};

export default async function NovaPagina() {
  const perfil = await exigirPerfil();
  const dominio = (await headers()).get("host") ?? "fraldometro";

  return (
    <div className="mx-auto grid max-w-2xl gap-8 px-4 py-12">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold tracking-[-0.02em]">Criar a página do bebê</h1>
        <p className="text-muted">Dá para mudar tudo depois. A página só vai ao ar quando vocês publicarem.</p>
      </div>
      <FormPagina inicial={INICIAL} userId={perfil.id} dominio={dominio} acao={criarPagina} textoBotao="Criar a página" />
    </div>
  );
}
