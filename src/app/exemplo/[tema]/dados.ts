import type { DadosPagina } from "@/components/pagina-do-bebe";
import type { TemaId } from "@/themes";

// O Antonio das páginas de exemplo.
export function dadosDeExemplo(tema: TemaId): DadosPagina {
  return {
    nomeBebe: "Antonio",
    sexo: "menino",
    jaNasceu: false,
    tema,
    chegada: "dezembro",
    recado: "Pelas minhas contas, até os 2 anos vou usar umas 4.000 fraldas. Quer cuidar de algumas?",
    encerraEm: "20 de dezembro",
    fotoUrl: null,
    metaFraldas: 4000,
    valorFraldaCentavos: 200,
    totalFraldas: 2512,
    doadores: 51,
  };
}
