// Registro dos temas da página do bebê. Os tokens ficam em ./temas.css;
// o banco guarda só o id do tema.

export const TEMAS = [
  { id: "placar", nome: "Placar", amostras: ["#16204a", "#ffd23f", "#5ce1b4"] },
  { id: "diario", nome: "Diário", amostras: ["#eef1ea", "#5b3a6e", "#c9b2d6"] },
  { id: "recortes", nome: "Recortes", amostras: ["#ff5a36", "#b9a6ff", "#7cc6ff"] },
] as const;

export type TemaId = (typeof TEMAS)[number]["id"];

export const TEMA_PADRAO: TemaId = "placar";

export function isTema(valor: string): valor is TemaId {
  return TEMAS.some((t) => t.id === valor);
}
