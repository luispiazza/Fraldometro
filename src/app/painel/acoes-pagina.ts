"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pageMembers, pages } from "@/db/schema";
import { exigirPerfil } from "@/lib/auth";
import { problemaNoSlug, reaisParaCentavos, type Sexo } from "@/lib/pagina";
import { paginaDoMembro } from "@/lib/paginas";
import { isTema } from "@/themes";

export type EstadoPagina = { erro?: string; campo?: string; salvo?: boolean };

type Falha = { erro: string; campo: string };

const SEXOS: Sexo[] = ["menino", "menina", "surpresa"];
const RECADO_MAX = 280;

/** Lê e confere o formulário. `fotoAtual` é a foto já salva, que pode ter vindo de outro membro. */
function lerFormulario(form: FormData, userId: string, fotoAtual: string | null) {
  const texto = (nome: string) => String(form.get(nome) ?? "").trim();
  const falha = (campo: string, erro: string): Falha => ({ campo, erro });

  const nomeBebe = texto("nomeBebe");
  if (nomeBebe.length < 2 || nomeBebe.length > 60) return falha("nomeBebe", "Diga o nome do bebê (ou um apelido).");

  const sexo = texto("sexo") as Sexo;
  if (!SEXOS.includes(sexo)) return falha("sexo", "Escolha menino, menina ou surpresa.");

  const jaNasceu = form.get("jaNasceu") === "on";
  const mesPrevisto = texto("mesPrevisto") || null;
  if (mesPrevisto && !/^\d{4}-(0[1-9]|1[0-2])$/.test(mesPrevisto)) return falha("mesPrevisto", "Confira o mês.");

  const fotoPath = texto("fotoPath") || null;
  // Foto nova só pode vir da pasta de quem está salvando (mesmo caminho que o upload usa).
  const fotoNovaValida = (p: string) => p.startsWith(`${userId}/`) && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/.test(p);
  if (fotoPath && fotoPath !== fotoAtual && !fotoNovaValida(fotoPath)) {
    return falha("foto", "Não deu para usar essa foto. Envie de novo.");
  }

  const recado = texto("recado") || null;
  if (recado && recado.length > RECADO_MAX) return falha("recado", `O recado pode ter até ${RECADO_MAX} letras.`);

  const tema = texto("tema");
  if (!isTema(tema)) return falha("tema", "Escolha um tema.");

  const metaFraldas = Number(texto("metaFraldas"));
  if (!Number.isInteger(metaFraldas) || metaFraldas < 50 || metaFraldas > 20000) {
    return falha("metaFraldas", "A meta precisa ficar entre 50 e 20.000 fraldas.");
  }

  const valorFraldaCentavos = reaisParaCentavos(texto("valorFralda"));
  if (!(valorFraldaCentavos >= 50 && valorFraldaCentavos <= 2000)) {
    return falha("valorFralda", "Cada fralda pode valer de R$ 0,50 a R$ 20,00.");
  }

  const encerra = texto("encerraEm");
  if (encerra && !/^\d{4}-\d{2}-\d{2}$/.test(encerra)) return falha("encerraEm", "Confira a data.");
  // Fim do dia no horário de Brasília.
  const encerraEm = encerra ? new Date(`${encerra}T23:59:59-03:00`) : null;

  const slug = texto("slug").toLowerCase();
  const problema = problemaNoSlug(slug);
  if (problema) return falha("slug", problema);

  return {
    dados: { nomeBebe, sexo, jaNasceu, mesPrevisto, fotoPath, recado, tema, metaFraldas, valorFraldaCentavos, encerraEm, slug },
  };
}

function slugRepetido(e: unknown): boolean {
  const erro = e as { code?: string; cause?: { code?: string } };
  return erro?.code === "23505" || erro?.cause?.code === "23505";
}

const SLUG_EM_USO: EstadoPagina = { campo: "slug", erro: "Esse link já é de outra página. Tente outro." };

export async function criarPagina(_: EstadoPagina, form: FormData): Promise<EstadoPagina> {
  const perfil = await exigirPerfil();
  const lido = lerFormulario(form, perfil.id, null);
  if ("erro" in lido) return lido;

  let id: string;
  try {
    id = await db.transaction(async (tx) => {
      const [nova] = await tx.insert(pages).values(lido.dados).returning({ id: pages.id });
      await tx.insert(pageMembers).values({ pageId: nova.id, userId: perfil.id, papel: "dono" });
      return nova.id;
    });
  } catch (e) {
    if (slugRepetido(e)) return SLUG_EM_USO;
    throw e;
  }
  redirect(`/painel/paginas/${id}?criada=1`);
}

export async function atualizarPagina(id: string, _: EstadoPagina, form: FormData): Promise<EstadoPagina> {
  const perfil = await exigirPerfil();
  const pagina = await paginaDoMembro(id, perfil.id);
  if (!pagina) return { erro: "Você não tem acesso a esta página." };

  const lido = lerFormulario(form, perfil.id, pagina.fotoPath);
  if ("erro" in lido) return lido;

  try {
    await db.update(pages).set(lido.dados).where(eq(pages.id, id));
  } catch (e) {
    if (slugRepetido(e)) return SLUG_EM_USO;
    throw e;
  }
  // Atualiza o título da tela e a lista do painel com o que acabou de ser salvo.
  revalidatePath("/painel", "layout");
  return { salvo: true };
}
